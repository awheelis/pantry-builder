import db from '../db/connection';

export function listStores() {
  return db.prepare('SELECT * FROM stores ORDER BY name ASC').all();
}

export function createStore(name: string) {
  const result = db.prepare('INSERT INTO stores (name) VALUES (?)').run(name);
  return db.prepare('SELECT * FROM stores WHERE id = ?').get(result.lastInsertRowid);
}

export function updateStore(id: number, name: string) {
  db.prepare('UPDATE stores SET name = ? WHERE id = ?').run(name, id);
  return db.prepare('SELECT * FROM stores WHERE id = ?').get(id);
}

export function deleteStore(id: number) {
  db.prepare('DELETE FROM stores WHERE id = ?').run(id);
}
