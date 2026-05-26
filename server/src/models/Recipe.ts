import pool from '../db/connection';

export async function listRecipes(q?: string) {
  if (q) {
    const { rows } = await pool.query(
      'SELECT * FROM recipes WHERE name ILIKE $1 ORDER BY name ASC',
      [`%${q}%`]
    );
    return rows;
  }
  const { rows } = await pool.query('SELECT * FROM recipes ORDER BY name ASC');
  return rows;
}

export async function getRecipe(id: number) {
  const { rows } = await pool.query('SELECT * FROM recipes WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function createRecipe(data: {
  name: string;
  description?: string | null;
  serving_size: number;
  ease_rating?: number | null;
  deliciousness_rating?: number | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO recipes (name, description, serving_size, ease_rating, deliciousness_rating)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.name, data.description ?? null, data.serving_size, data.ease_rating ?? null, data.deliciousness_rating ?? null]
  );
  return rows[0];
}

export async function updateRecipe(id: number, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id];
  const { rows } = await pool.query(
    `UPDATE recipes SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteRecipe(id: number) {
  await pool.query('DELETE FROM recipes WHERE id = $1', [id]);
}
