import pool from '../db/connection';

export interface CustomGroceryItem {
  id: number;
  name: string;
  is_purchased: 0 | 1;
}

export async function listCustomItems(): Promise<CustomGroceryItem[]> {
  const { rows } = await pool.query('SELECT * FROM custom_grocery_items ORDER BY id');
  return rows;
}

export async function addCustomItem(name: string): Promise<CustomGroceryItem> {
  const { rows } = await pool.query(
    'INSERT INTO custom_grocery_items (name) VALUES ($1) RETURNING *',
    [name.trim()]
  );
  return rows[0];
}

export async function toggleCustomItem(id: number): Promise<CustomGroceryItem | null> {
  const { rows } = await pool.query(
    'UPDATE custom_grocery_items SET is_purchased = CASE WHEN is_purchased = 1 THEN 0 ELSE 1 END WHERE id = $1 RETURNING *',
    [id]
  );
  return rows[0] ?? null;
}

export async function deleteCustomItem(id: number): Promise<void> {
  await pool.query('DELETE FROM custom_grocery_items WHERE id = $1', [id]);
}
