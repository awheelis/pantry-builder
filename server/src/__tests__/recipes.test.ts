jest.mock('../db/connection', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schema);
  return { __esModule: true, default: db };
});

import request from 'supertest';
import db from '../db/connection';
import { createApp } from '../app';

const app = createApp();

let ingredientId: number;

beforeAll(() => {
  ingredientId = db.prepare(`
    INSERT INTO ingredients (name, category, unit) VALUES ('Flour', 'dry', 'cups')
  `).run().lastInsertRowid as number;
});

afterEach(() => {
  db.prepare('DELETE FROM recipe_ingredients').run();
  db.prepare('DELETE FROM recipes').run();
});

afterAll(() => {
  db.prepare('DELETE FROM ingredients').run();
});

function seedRecipe(overrides: Partial<{ name: string; serving_size: number; description: string }> = {}) {
  return db.prepare(`
    INSERT INTO recipes (name, description, serving_size) VALUES (@name, @description, @serving_size)
  `).run({ name: 'Bread', description: null, serving_size: 4, ...overrides });
}

describe('GET /api/recipes', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('searches by name case-insensitively', async () => {
    seedRecipe({ name: 'Banana Bread' });
    seedRecipe({ name: 'Pasta Carbonara' });
    const res = await request(app).get('/api/recipes?q=bread');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Banana Bread');
  });
});

describe('POST /api/recipes', () => {
  it('creates a recipe', async () => {
    const res = await request(app).post('/api/recipes').send({
      name: 'Omelette',
      serving_size: 1,
      description: 'Page 12',
      ease_rating: 5,
      deliciousness_rating: 4,
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Omelette');
    expect(res.body.ease_rating).toBe(5);
  });

  it('rejects missing name', async () => {
    const res = await request(app).post('/api/recipes').send({ serving_size: 2 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/recipes/:id', () => {
  it('returns recipe with ingredients', async () => {
    const { lastInsertRowid: recipeId } = seedRecipe({ name: 'Simple Bread' });
    db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 2, 'cups')
    `).run(recipeId, ingredientId);

    const res = await request(app).get(`/api/recipes/${recipeId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Simple Bread');
    expect(res.body.ingredients).toHaveLength(1);
    expect(res.body.ingredients[0].ingredient_name).toBe('Flour');
    expect(res.body.ingredients[0].amount).toBe(2);
  });

  it('returns 404 for missing recipe', async () => {
    const res = await request(app).get('/api/recipes/999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/recipes/:id', () => {
  it('updates recipe fields', async () => {
    const { lastInsertRowid: id } = seedRecipe({ name: 'Old Name' });
    const res = await request(app).put(`/api/recipes/${id}`).send({ name: 'New Name', ease_rating: 3 });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
    expect(res.body.ease_rating).toBe(3);
  });
});

describe('DELETE /api/recipes/:id', () => {
  it('deletes recipe and cascades to recipe_ingredients', async () => {
    const { lastInsertRowid: id } = seedRecipe();
    db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 1, 'cup')
    `).run(id, ingredientId);
    const res = await request(app).delete(`/api/recipes/${id}`);
    expect(res.status).toBe(204);
    expect(db.prepare('SELECT * FROM recipe_ingredients WHERE recipe_id = ?').all(id)).toHaveLength(0);
  });
});

describe('Recipe ingredients nested routes', () => {
  let recipeId: number;

  beforeEach(() => {
    recipeId = seedRecipe().lastInsertRowid as number;
  });

  it('POST adds an ingredient to a recipe', async () => {
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/ingredients`)
      .send({ ingredient_id: ingredientId, amount: 3, unit: 'cups' });
    expect(res.status).toBe(201);
    expect(res.body.amount).toBe(3);
    expect(res.body.unit).toBe('cups');
  });

  it('POST rejects missing fields', async () => {
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/ingredients`)
      .send({ ingredient_id: ingredientId });
    expect(res.status).toBe(400);
  });

  it('GET lists recipe ingredients with names', async () => {
    db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 2, 'cups')
    `).run(recipeId, ingredientId);
    const res = await request(app).get(`/api/recipes/${recipeId}/ingredients`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ingredient_name).toBe('Flour');
  });

  it('PUT updates amount and unit', async () => {
    const { lastInsertRowid: riId } = db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 1, 'cup')
    `).run(recipeId, ingredientId);
    const res = await request(app)
      .put(`/api/recipes/${recipeId}/ingredients/${riId}`)
      .send({ amount: 2.5, unit: 'tablespoons' });
    expect(res.status).toBe(200);
    expect(res.body.amount).toBe(2.5);
    expect(res.body.unit).toBe('tablespoons');
  });

  it('DELETE removes a recipe ingredient', async () => {
    const { lastInsertRowid: riId } = db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 1, 'cup')
    `).run(recipeId, ingredientId);
    const res = await request(app).delete(`/api/recipes/${recipeId}/ingredients/${riId}`);
    expect(res.status).toBe(204);
  });
});

describe('Ingredient substitution', () => {
  let recipeId: number;
  let riId: number;
  let subIngredientId: number;

  beforeEach(() => {
    recipeId = seedRecipe().lastInsertRowid as number;
    subIngredientId = db.prepare(`
      INSERT INTO ingredients (name, category, unit) VALUES ('Almond Flour', 'dry', 'cups')
    `).run().lastInsertRowid as number;
    riId = db.prepare(`
      INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 2, 'cups')
    `).run(recipeId, ingredientId).lastInsertRowid as number;
  });

  afterEach(() => {
    // recipe_ingredients must be cleared before deleting the ingredient (FK ordering)
    db.prepare('DELETE FROM recipe_ingredients WHERE ingredient_id = @id OR original_ingredient_id = @id')
      .run({ id: subIngredientId });
    db.prepare('DELETE FROM ingredients WHERE id = ?').run(subIngredientId);
  });

  it('substitutes ingredient and tracks original', async () => {
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/ingredients/${riId}/substitute`)
      .send({ new_ingredient_id: subIngredientId });
    expect(res.status).toBe(200);
    expect(res.body.ingredient_name).toBe('Almond Flour');
    expect(res.body.is_substituted).toBe(1);
    expect(res.body.original_ingredient_name).toBe('Flour');
  });

  it('re-substituting preserves the original (not the intermediate)', async () => {
    // First substitution: Flour → Almond Flour
    await request(app)
      .post(`/api/recipes/${recipeId}/ingredients/${riId}/substitute`)
      .send({ new_ingredient_id: subIngredientId });

    const thirdIngId = db.prepare(`
      INSERT INTO ingredients (name, category, unit) VALUES ('Rice Flour', 'dry', 'cups')
    `).run().lastInsertRowid as number;

    // Second substitution: Almond Flour → Rice Flour (original should still be Flour)
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/ingredients/${riId}/substitute`)
      .send({ new_ingredient_id: thirdIngId });
    expect(res.body.original_ingredient_name).toBe('Flour');
    db.prepare('DELETE FROM recipe_ingredients WHERE ingredient_id = @id OR original_ingredient_id = @id').run({ id: thirdIngId });
    db.prepare('DELETE FROM ingredients WHERE id = ?').run(thirdIngId);
  });

  it('reverts substitution to original', async () => {
    db.prepare(`
      UPDATE recipe_ingredients SET ingredient_id = ?, is_substituted = 1, original_ingredient_id = ? WHERE id = ?
    `).run(subIngredientId, ingredientId, riId);
    const res = await request(app).post(`/api/recipes/${recipeId}/ingredients/${riId}/revert`);
    expect(res.status).toBe(200);
    expect(res.body.ingredient_id).toBe(ingredientId);
    expect(res.body.is_substituted).toBe(0);
    expect(res.body.original_ingredient_id).toBeNull();
  });

  it('returns 400 if new_ingredient_id missing', async () => {
    const res = await request(app)
      .post(`/api/recipes/${recipeId}/ingredients/${riId}/substitute`)
      .send({});
    expect(res.status).toBe(400);
  });
});
