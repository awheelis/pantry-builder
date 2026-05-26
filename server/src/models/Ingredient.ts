import pool from '../db/connection';

export async function listIngredients(category?: string, store?: string) {
  const params: (string | number)[] = [];
  let idx = 1;
  let sql = `
    SELECT i.*, s.name AS store_name
    FROM ingredients i
    LEFT JOIN stores s ON s.id = i.suggested_purchase_location
    WHERE 1=1
  `;
  if (category) { sql += ` AND i.category = $${idx++}`; params.push(category); }
  if (store)    { sql += ` AND i.suggested_purchase_location = $${idx++}`; params.push(Number(store)); }
  sql += ' ORDER BY i.name ASC';
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function createIngredient(data: {
  name: string;
  category: string;
  unit: string;
  suggested_purchase_location?: number | null;
}) {
  const { rows } = await pool.query(
    `INSERT INTO ingredients (name, category, unit, suggested_purchase_location)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.name, data.category, data.unit, data.suggested_purchase_location ?? null]
  );
  return rows[0];
}

export async function updateIngredient(id: number, data: Record<string, unknown>) {
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id];
  const { rows } = await pool.query(
    `UPDATE ingredients SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
    values
  );
  return rows[0];
}

export async function deleteIngredient(id: number) {
  await pool.query('DELETE FROM ingredients WHERE id = $1', [id]);
}
