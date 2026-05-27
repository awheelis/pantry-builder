import pool from '../db/connection';

export async function listRecipes(userId: number, q?: string) {
  if (q) {
    const { rows } = await pool.query(
      'SELECT * FROM recipes WHERE user_id = $1 AND name ILIKE $2 ORDER BY name ASC',
      [userId, `%${q}%`]
    );
    return rows;
  }
  const { rows } = await pool.query(
    'SELECT * FROM recipes WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return rows;
}

export async function getRecipe(id: number, userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function createRecipe(userId: number, data: {
  name: string;
  description?: string | null;
  serving_size: number;
  ease_rating?: number | null;
  deliciousness_rating?: number | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO recipes (name, description, serving_size, ease_rating, deliciousness_rating, user_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [data.name, data.description ?? null, data.serving_size, data.ease_rating ?? null, data.deliciousness_rating ?? null, userId]
  );
  return rows[0];
}

export async function updateRecipe(id: number, userId: number, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id, userId];
  const { rows } = await pool.query(
    `UPDATE recipes SET ${sets} WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteRecipe(id: number, userId: number) {
  await pool.query('DELETE FROM recipes WHERE id = $1 AND user_id = $2', [id, userId]);
}
