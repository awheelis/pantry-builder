import pool from '../db/connection';

export async function rebuildGroceryList(userId: number) {
  const { rows: staged } = await pool.query(
    'SELECT id, recipe_id, scale_factor FROM staged_recipes WHERE user_id = $1',
    [userId]
  );

  const totals = new Map<number, { total_amount: number; unit: string }>();

  for (const sr of staged) {
    const { rows: items } = await pool.query(
      'SELECT ingredient_id, amount, unit FROM recipe_ingredients WHERE recipe_id = $1',
      [sr.recipe_id]
    );
    for (const item of items) {
      const existing = totals.get(item.ingredient_id);
      if (existing && existing.unit === item.unit) {
        existing.total_amount += Number(item.amount) * Number(sr.scale_factor);
      } else if (!existing) {
        totals.set(item.ingredient_id, {
          total_amount: Number(item.amount) * Number(sr.scale_factor),
          unit: item.unit,
        });
      }
    }
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (totals.size === 0) {
      await client.query('DELETE FROM grocery_items WHERE user_id = $1', [userId]);
    } else {
      for (const [ingredient_id, { total_amount, unit }] of totals) {
        await client.query(`
          INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased, user_id)
          VALUES ($1, $2, $3, 0, $4)
          ON CONFLICT (user_id, ingredient_id) DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            unit = EXCLUDED.unit
        `, [ingredient_id, total_amount, unit, userId]);
      }
      await client.query(
        'DELETE FROM grocery_items WHERE user_id = $1 AND NOT (ingredient_id = ANY($2))',
        [userId, Array.from(totals.keys())]
      );
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

export async function getGroceryList(userId: number, category?: string, store?: string) {
  const params: (string | number)[] = [userId];
  let idx = 2;
  let sql = `
    SELECT
      gi.id,
      gi.ingredient_id,
      i.name AS ingredient_name,
      i.category,
      i.unit AS default_unit,
      gi.total_amount,
      gi.unit,
      gi.is_purchased,
      s.id AS store_id,
      s.name AS store_name
    FROM grocery_items gi
    JOIN ingredients i ON i.id = gi.ingredient_id
    LEFT JOIN stores s ON s.id = i.suggested_purchase_location
    WHERE gi.user_id = $1
  `;
  if (category) { sql += ` AND i.category = $${idx++}`; params.push(category); }
  if (store)    { sql += ` AND s.id = $${idx++}`; params.push(Number(store)); }
  sql += ' ORDER BY gi.is_purchased ASC, i.name ASC';
  const { rows } = await pool.query(sql, params);
  return rows;
}

export async function togglePurchased(id: number, userId: number) {
  const { rows } = await pool.query(`
    UPDATE grocery_items
    SET is_purchased = CASE WHEN is_purchased = 1 THEN 0 ELSE 1 END
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [id, userId]);
  return rows[0] ?? null;
}
