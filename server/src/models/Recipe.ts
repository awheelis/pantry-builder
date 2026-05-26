import db from '../db/connection';

export function listRecipes(q?: string) {
  let sql = 'SELECT * FROM recipes';
  const params: string[] = [];
  if (q) {
    sql += ' WHERE name LIKE ?';
    params.push(`%${q}%`);
  }
  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
}

export function getRecipe(id: number) {
  return db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
}

export function createRecipe(data: {
  name: string;
  description?: string;
  serving_size: number;
  ease_rating?: number | null;
  deliciousness_rating?: number | null;
}) {
  const result = db.prepare(`
    INSERT INTO recipes (name, description, serving_size, ease_rating, deliciousness_rating)
    VALUES (@name, @description, @serving_size, @ease_rating, @deliciousness_rating)
  `).run(data);
  return db.prepare('SELECT * FROM recipes WHERE id = ?').get(result.lastInsertRowid);
}

export function updateRecipe(id: number, data: {
  name?: string;
  description?: string;
  serving_size?: number;
  ease_rating?: number | null;
  deliciousness_rating?: number | null;
}) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE recipes SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
}

export function deleteRecipe(id: number) {
  db.prepare('DELETE FROM recipes WHERE id = ?').run(id);
}
