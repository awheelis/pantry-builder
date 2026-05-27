import pool from '../db/connection';

export async function listStores(userId: number) {
  const { rows } = await pool.query(
    'SELECT * FROM stores WHERE user_id = $1 ORDER BY name ASC',
    [userId]
  );
  return rows;
}

export async function createStore(name: string, userId: number) {
  const { rows } = await pool.query(
    'INSERT INTO stores (name, user_id) VALUES ($1, $2) RETURNING *',
    [name, userId]
  );
  return rows[0];
}

export async function updateStore(id: number, name: string, userId: number) {
  const { rows } = await pool.query(
    'UPDATE stores SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [name, id, userId]
  );
  return rows[0];
}

export async function deleteStore(id: number, userId: number) {
  await pool.query('DELETE FROM stores WHERE id = $1 AND user_id = $2', [id, userId]);
}
