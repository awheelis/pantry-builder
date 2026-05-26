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

function seedStore(name: string) {
  return db.prepare('INSERT INTO stores (name) VALUES (?)').run(name).lastInsertRowid as number;
}
function seedIngredient(name: string, category: string, unit: string, storeId?: number) {
  return db.prepare(`
    INSERT INTO ingredients (name, category, unit, suggested_purchase_location) VALUES (?, ?, ?, ?)
  `).run(name, category, unit, storeId ?? null).lastInsertRowid as number;
}
function seedRecipe(name: string) {
  return db.prepare('INSERT INTO recipes (name, serving_size) VALUES (?, 4)').run(name).lastInsertRowid as number;
}
function seedRI(recipeId: number, ingredientId: number, amount: number, unit: string) {
  db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, ?, ?)
  `).run(recipeId, ingredientId, amount, unit);
}
function seedStaged(recipeId: number, scaleFactor = 1.0) {
  return db.prepare('INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, ?)').run(recipeId, scaleFactor).lastInsertRowid as number;
}

afterEach(() => {
  db.prepare('DELETE FROM grocery_items').run();
  db.prepare('DELETE FROM staged_recipes').run();
  db.prepare('DELETE FROM recipe_ingredients').run();
  db.prepare('DELETE FROM recipes').run();
  db.prepare('DELETE FROM ingredients').run();
  db.prepare('DELETE FROM stores').run();
});

describe('GET /api/grocery', () => {
  it('returns empty list when no grocery items exist', async () => {
    const res = await request(app).get('/api/grocery');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('filters by category', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    const milkId = seedIngredient('Milk', 'dairy', 'gallons');
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 2, 'cups')").run(flourId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 1, 'gallons')").run(milkId);

    const res = await request(app).get('/api/grocery?category=dry');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ingredient_name).toBe('Flour');
  });

  it('filters by store', async () => {
    const aldiId = seedStore('Aldi');
    const flourId = seedIngredient('Flour', 'dry', 'cups', aldiId);
    const milkId = seedIngredient('Milk', 'dairy', 'gallons');
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 2, 'cups')").run(flourId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 1, 'gallons')").run(milkId);

    const res = await request(app).get(`/api/grocery?store=${aldiId}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].ingredient_name).toBe('Flour');
  });

  it('returns unpurchased items before purchased items', async () => {
    const aId = seedIngredient('Apples', 'produce', 'lbs');
    const bId = seedIngredient('Bread', 'dry', 'loaves');
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 1, 'lbs', 1)").run(aId);
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 1, 'loaves', 0)").run(bId);

    const res = await request(app).get('/api/grocery');
    expect(res.body[0].ingredient_name).toBe('Bread');
    expect(res.body[1].ingredient_name).toBe('Apples');
  });
});

describe('POST /api/grocery/rebuild', () => {
  it('builds grocery list from staged recipes', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    const recipeId = seedRecipe('Bread');
    seedRI(recipeId, flourId, 2, 'cups');
    seedStaged(recipeId);

    const res = await request(app).post('/api/grocery/rebuild');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    const items = db.prepare('SELECT * FROM grocery_items').all() as Array<{ total_amount: number }>;
    expect(items).toHaveLength(1);
    expect(items[0].total_amount).toBe(2);
  });

  it('applies scale factor', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    const recipeId = seedRecipe('Big Bread');
    seedRI(recipeId, flourId, 2, 'cups');
    seedStaged(recipeId, 3.0);

    await request(app).post('/api/grocery/rebuild');
    const item = db.prepare('SELECT * FROM grocery_items').get() as { total_amount: number };
    expect(item.total_amount).toBe(6);
  });

  it('aggregates same ingredient across multiple staged recipes', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    const r1 = seedRecipe('Bread');
    const r2 = seedRecipe('Cake');
    seedRI(r1, flourId, 2, 'cups');
    seedRI(r2, flourId, 1.5, 'cups');
    seedStaged(r1);
    seedStaged(r2);

    await request(app).post('/api/grocery/rebuild');
    const item = db.prepare('SELECT * FROM grocery_items').get() as { total_amount: number };
    expect(item.total_amount).toBeCloseTo(3.5);
  });

  it('preserves is_purchased when scale factor updates', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    const recipeId = seedRecipe('Bread');
    seedRI(recipeId, flourId, 2, 'cups');
    const stagedId = seedStaged(recipeId, 1.0);

    await request(app).post('/api/grocery/rebuild');
    db.prepare('UPDATE grocery_items SET is_purchased = 1 WHERE ingredient_id = ?').run(flourId);

    await request(app).put(`/api/staged/${stagedId}`).send({ scale_factor: 2 });

    const item = db.prepare('SELECT * FROM grocery_items WHERE ingredient_id = ?').get(flourId) as { is_purchased: number; total_amount: number };
    expect(item.is_purchased).toBe(1);
    expect(item.total_amount).toBe(4);
  });

  it('clears all items when no recipes are staged', async () => {
    const flourId = seedIngredient('Flour', 'dry', 'cups');
    db.prepare("INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 2, 'cups')").run(flourId);

    await request(app).post('/api/grocery/rebuild');
    expect(db.prepare('SELECT * FROM grocery_items').all()).toHaveLength(0);
  });
});

describe('PATCH /api/grocery/:id/purchase', () => {
  it('toggles is_purchased on', async () => {
    const milkId = seedIngredient('Milk', 'dairy', 'gallons');
    const { lastInsertRowid: gId } = db.prepare(
      "INSERT INTO grocery_items (ingredient_id, total_amount, unit) VALUES (?, 1, 'gallons')"
    ).run(milkId);

    const res = await request(app).patch(`/api/grocery/${gId}/purchase`);
    expect(res.status).toBe(200);
    expect(res.body.is_purchased).toBe(1);
  });

  it('toggles is_purchased back off', async () => {
    const milkId = seedIngredient('Milk', 'dairy', 'gallons');
    const { lastInsertRowid: gId } = db.prepare(
      "INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased) VALUES (?, 1, 'gallons', 1)"
    ).run(milkId);

    const res = await request(app).patch(`/api/grocery/${gId}/purchase`);
    expect(res.body.is_purchased).toBe(0);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).patch('/api/grocery/99999/purchase');
    expect(res.status).toBe(404);
  });
});
