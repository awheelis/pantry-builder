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

let recipeId: number;
let ingredientId: number;

beforeAll(() => {
  ingredientId = db.prepare(`
    INSERT INTO ingredients (name, category, unit) VALUES ('Eggs', 'dairy', 'count')
  `).run().lastInsertRowid as number;

  recipeId = db.prepare(`
    INSERT INTO recipes (name, serving_size) VALUES ('Scrambled Eggs', 2)
  `).run().lastInsertRowid as number;

  db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 3, 'count')
  `).run(recipeId, ingredientId);
});

afterEach(() => {
  db.prepare('DELETE FROM grocery_items').run();
  db.prepare('DELETE FROM staged_recipes').run();
});

afterAll(() => {
  db.prepare('DELETE FROM recipe_ingredients').run();
  db.prepare('DELETE FROM recipes').run();
  db.prepare('DELETE FROM ingredients').run();
});

describe('POST /api/staged', () => {
  it('stages a recipe with scale_factor = 1', async () => {
    const res = await request(app).post('/api/staged').send({ recipe_id: recipeId });
    expect(res.status).toBe(201);
    expect(res.body.recipe_id).toBe(recipeId);
    expect(res.body.scale_factor).toBe(1);
  });

  it('does not duplicate if already staged', async () => {
    await request(app).post('/api/staged').send({ recipe_id: recipeId });
    await request(app).post('/api/staged').send({ recipe_id: recipeId });
    expect(db.prepare('SELECT * FROM staged_recipes').all()).toHaveLength(1);
  });

  it('rebuilds grocery list on stage', async () => {
    await request(app).post('/api/staged').send({ recipe_id: recipeId });
    const items = db.prepare('SELECT * FROM grocery_items').all() as Array<{ total_amount: number }>;
    expect(items).toHaveLength(1);
    expect(items[0].total_amount).toBe(3);
  });

  it('rejects missing recipe_id', async () => {
    const res = await request(app).post('/api/staged').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/staged', () => {
  it('lists staged recipes with recipe name', async () => {
    db.prepare('INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)').run(recipeId);
    const res = await request(app).get('/api/staged');
    expect(res.status).toBe(200);
    expect(res.body[0].recipe_name).toBe('Scrambled Eggs');
  });

  it('returns empty array when nothing is staged', async () => {
    const res = await request(app).get('/api/staged');
    expect(res.body).toEqual([]);
  });
});

describe('PUT /api/staged/:id', () => {
  it('updates scale factor and rebuilds grocery with new amounts', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);

    const res = await request(app).put(`/api/staged/${sid}`).send({ scale_factor: 2 });
    expect(res.status).toBe(200);
    expect(res.body.scale_factor).toBe(2);

    const item = db.prepare('SELECT * FROM grocery_items').get() as { total_amount: number };
    expect(item.total_amount).toBe(6);
  });

  it('rejects scale_factor of 0', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);
    expect((await request(app).put(`/api/staged/${sid}`).send({ scale_factor: 0 })).status).toBe(400);
  });

  it('rejects negative scale_factor', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);
    expect((await request(app).put(`/api/staged/${sid}`).send({ scale_factor: -1 })).status).toBe(400);
  });
});

describe('DELETE /api/staged/:id', () => {
  it('unstages a recipe and clears its grocery items', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 3, 'count')").run(ingredientId);

    const res = await request(app).delete(`/api/staged/${sid}`);
    expect(res.status).toBe(204);
    expect(db.prepare('SELECT * FROM staged_recipes').all()).toHaveLength(0);
    expect(db.prepare('SELECT * FROM grocery_items').all()).toHaveLength(0);
  });
});

describe('DELETE /api/staged (clear all)', () => {
  it('removes all staged recipes', async () => {
    db.prepare('INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)').run(recipeId);
    const res = await request(app).delete('/api/staged');
    expect(res.status).toBe(204);
    expect(db.prepare('SELECT * FROM staged_recipes').all()).toHaveLength(0);
  });
});

describe('GET /api/staged/:id/breakdown', () => {
  it('returns 0% progress when nothing purchased', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 2)'
    ).run(recipeId);
    await request(app).post('/api/grocery/rebuild');

    const res = await request(app).get(`/api/staged/${sid}/breakdown`);
    expect(res.status).toBe(200);
    expect(res.body.progress).toBe(0);
    expect(res.body.ingredients[0].scaled_amount).toBe(6);
  });

  it('returns 100% when all ingredients are purchased', async () => {
    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 3, 'count', 1)").run(ingredientId);

    const res = await request(app).get(`/api/staged/${sid}/breakdown`);
    expect(res.body.progress).toBe(100);
  });

  it('returns 50% when half the ingredients are purchased', async () => {
    const egg2Id = db.prepare(
      "INSERT INTO ingredients (name, category, unit) VALUES ('Butter', 'dairy', 'tbsp')"
    ).run().lastInsertRowid as number;
    db.prepare(
      'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, 2, \'tbsp\')'
    ).run(recipeId, egg2Id);

    const { lastInsertRowid: sid } = db.prepare(
      'INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, 1)'
    ).run(recipeId);

    // Only eggs are purchased
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 3, 'count', 1)").run(ingredientId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 2, 'tbsp', 0)").run(egg2Id);

    const res = await request(app).get(`/api/staged/${sid}/breakdown`);
    expect(res.body.progress).toBe(50);

    // grocery items reference the ingredient, so clear them first
    db.prepare('DELETE FROM grocery_items WHERE ingredient_id = ?').run(egg2Id);
    db.prepare('DELETE FROM recipe_ingredients WHERE ingredient_id = ?').run(egg2Id);
    db.prepare('DELETE FROM ingredients WHERE id = ?').run(egg2Id);
  });

  it('returns 404 for unknown staged id', async () => {
    const res = await request(app).get('/api/staged/99999/breakdown');
    expect(res.status).toBe(404);
  });
});
