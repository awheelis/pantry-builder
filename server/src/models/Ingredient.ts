import db from '../db/connection';

export function listIngredients(category?: string, store?: string) {
  let sql = `
    SELECT i.*, s.name AS store_name
    FROM ingredients i
    LEFT JOIN stores s ON s.id = i.suggested_purchase_location
    WHERE 1=1
  `;
  const params: (string | number)[] = [];
  if (category) { sql += ' AND i.category = ?'; params.push(category); }
  if (store) { sql += ' AND i.suggested_purchase_location = ?'; params.push(Number(store)); }
  sql += ' ORDER BY i.name ASC';
  return db.prepare(sql).all(...params);
}

export function getIngredient(id: number) {
  return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
}

export function createIngredient(data: {
  name: string;
  category: string;
  unit: string;
  suggested_purchase_location?: number | null;
}) {
  const result = db.prepare(`
    INSERT INTO ingredients (name, category, unit, suggested_purchase_location)
    VALUES (@name, @category, @unit, @suggested_purchase_location)
  `).run(data);
  return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(result.lastInsertRowid);
}

export function updateIngredient(id: number, data: {
  name?: string;
  category?: string;
  unit?: string;
  suggested_purchase_location?: number | null;
}) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE ingredients SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
}

export function deleteIngredient(id: number) {
  db.prepare('DELETE FROM ingredients WHERE id = ?').run(id);
}
