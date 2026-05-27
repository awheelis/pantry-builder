import pool from '../db/connection';

export interface CustomGroceryItem {
  id: number;
  name: string;
  is_purchased: 0 | 1;
}

export async function listCustomItems(userId: number): Promise<CustomGroceryItem[]> {
  const { rows } = await pool.query(
    'SELECT * FROM custom_grocery_items WHERE user_id = $1 ORDER BY id',
    [userId]
  );
  return rows;
}

export async function addCustomItem(name: string, userId: number): Promise<CustomGroceryItem> {
  const { rows } = await pool.query(
    'INSERT INTO custom_grocery_items (name, user_id) VALUES ($1, $2) RETURNING *',
    [name.trim(), userId]
  );
  return rows[0];
}

export async function toggleCustomItem(id: number, userId: number): Promise<CustomGroceryItem | null> {
  const { rows } = await pool.query(
    'UPDATE custom_grocery_items SET is_purchased = CASE WHEN is_purchased = 1 THEN 0 ELSE 1 END WHERE id = $1 AND user_id = $2 RETURNING *',
    [id, userId]
  );
  return rows[0] ?? null;
}

export async function deleteCustomItem(id: number, userId: number): Promise<void> {
  await pool.query('DELETE FROM custom_grocery_items WHERE id = $1 AND user_id = $2', [id, userId]);
}
