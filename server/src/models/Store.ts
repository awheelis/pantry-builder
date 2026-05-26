import pool from '../db/connection';

export async function listStores() {
  const { rows } = await pool.query('SELECT * FROM stores ORDER BY name ASC');
  return rows;
}

export async function createStore(name: string) {
  const { rows } = await pool.query(
    'INSERT INTO stores (name) VALUES ($1) RETURNING *',
    [name]
  );
  return rows[0];
}

export async function updateStore(id: number, name: string) {
  const { rows } = await pool.query(
    'UPDATE stores SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );
  return rows[0];
}

export async function deleteStore(id: number) {
  await pool.query('DELETE FROM stores WHERE id = $1', [id]);
}
