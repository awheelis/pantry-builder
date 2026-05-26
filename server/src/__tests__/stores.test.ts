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

afterEach(() => {
  db.prepare('DELETE FROM stores').run();
});

describe('GET /api/stores', () => {
  it('returns empty array when no stores exist', async () => {
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all stores ordered by name', async () => {
    db.prepare("INSERT INTO stores (name) VALUES ('Walmart')").run();
    db.prepare("INSERT INTO stores (name) VALUES ('Aldi')").run();
    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Aldi');
    expect(res.body[1].name).toBe('Walmart');
  });
});

describe('POST /api/stores', () => {
  it('creates a store and returns it', async () => {
    const res = await request(app).post('/api/stores').send({ name: 'Costco' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Costco');
    expect(res.body.id).toBeGreaterThan(0);
  });

  it('rejects missing name', async () => {
    const res = await request(app).post('/api/stores').send({});
    expect(res.status).toBe(400);
  });

  it('rejects blank name', async () => {
    const res = await request(app).post('/api/stores').send({ name: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/stores/:id', () => {
  it('renames a store', async () => {
    const { lastInsertRowid } = db.prepare("INSERT INTO stores (name) VALUES ('Target')").run();
    const res = await request(app).put(`/api/stores/${lastInsertRowid}`).send({ name: 'Target Plus' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Target Plus');
  });
});

describe('DELETE /api/stores/:id', () => {
  it('deletes a store and returns 204', async () => {
    const { lastInsertRowid } = db.prepare("INSERT INTO stores (name) VALUES ('Kroger')").run();
    const res = await request(app).delete(`/api/stores/${lastInsertRowid}`);
    expect(res.status).toBe(204);
    expect(db.prepare('SELECT * FROM stores WHERE id = ?').get(lastInsertRowid)).toBeUndefined();
  });
});
