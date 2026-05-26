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

let storeId: number;

beforeAll(() => {
  storeId = db.prepare("INSERT INTO stores (name) VALUES ('Aldi')").run().lastInsertRowid as number;
});

afterEach(() => {
  db.prepare('DELETE FROM ingredients').run();
});

afterAll(() => {
  db.prepare('DELETE FROM stores').run();
});

function seedIngredient(overrides: Partial<{
  name: string; category: string; unit: string; suggested_purchase_location: number | null;
}> = {}) {
  return db.prepare(`
    INSERT INTO ingredients (name, category, unit, suggested_purchase_location)
    VALUES (@name, @category, @unit, @suggested_purchase_location)
  `).run({
    name: 'Chicken breast',
    category: 'meat',
    unit: 'lbs',
    suggested_purchase_location: null,
    ...overrides,
  });
}

describe('GET /api/ingredients', () => {
  it('returns empty array initially', async () => {
    const res = await request(app).get('/api/ingredients');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all ingredients with store name', async () => {
    seedIngredient({ suggested_purchase_location: storeId });
    const res = await request(app).get('/api/ingredients');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].store_name).toBe('Aldi');
  });

  it('filters by category', async () => {
    seedIngredient({ name: 'Chicken', category: 'meat' });
    seedIngredient({ name: 'Flour', category: 'dry' });
    const res = await request(app).get('/api/ingredients?category=meat');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Chicken');
  });

  it('filters by store', async () => {
    seedIngredient({ name: 'Milk', category: 'dairy', unit: 'gallons', suggested_purchase_location: storeId });
    seedIngredient({ name: 'Pasta', category: 'dry', unit: 'boxes' });
    const res = await request(app).get(`/api/ingredients?store=${storeId}`);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Milk');
  });
});

describe('POST /api/ingredients', () => {
  it('creates an ingredient', async () => {
    const res = await request(app).post('/api/ingredients').send({
      name: 'Garlic',
      category: 'produce',
      unit: 'cloves',
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Garlic');
    expect(res.body.category).toBe('produce');
  });

  it('rejects invalid category', async () => {
    const res = await request(app).post('/api/ingredients').send({
      name: 'X',
      category: 'invalid_category',
      unit: 'pcs',
    });
    expect(res.status).toBe(500);
  });

  it('rejects missing required fields', async () => {
    const res = await request(app).post('/api/ingredients').send({ name: 'X' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/ingredients/:id', () => {
  it('updates ingredient fields', async () => {
    const { lastInsertRowid: id } = seedIngredient({ name: 'Sugar', category: 'dry', unit: 'cups' });
    const res = await request(app).put(`/api/ingredients/${id}`).send({ unit: 'tablespoons' });
    expect(res.status).toBe(200);
    expect(res.body.unit).toBe('tablespoons');
  });
});

describe('DELETE /api/ingredients/:id', () => {
  it('deletes an ingredient', async () => {
    const { lastInsertRowid: id } = seedIngredient();
    const res = await request(app).delete(`/api/ingredients/${id}`);
    expect(res.status).toBe(204);
    expect(db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id)).toBeUndefined();
  });
});
