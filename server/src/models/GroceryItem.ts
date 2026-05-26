import db from '../db/connection';

interface AggregatedIngredient {
  ingredient_id: number;
  total_amount: number;
  unit: string;
}

export function rebuildGroceryList() {
  const staged = db.prepare('SELECT id, recipe_id, scale_factor FROM staged_recipes').all() as {
    id: number;
    recipe_id: number;
    scale_factor: number;
  }[];

  const totals = new Map<number, { total_amount: number; unit: string }>();

  for (const sr of staged) {
    const items = db
      .prepare('SELECT ingredient_id, amount, unit FROM recipe_ingredients WHERE recipe_id = ?')
      .all(sr.recipe_id) as { ingredient_id: number; amount: number; unit: string }[];

    for (const item of items) {
      const existing = totals.get(item.ingredient_id);
      if (existing && existing.unit === item.unit) {
        existing.total_amount += item.amount * sr.scale_factor;
      } else if (!existing) {
        totals.set(item.ingredient_id, {
          total_amount: item.amount * sr.scale_factor,
          unit: item.unit,
        });
      }
      // mismatched units: skip aggregation (keep first unit encountered)
    }
  }

  const upsert = db.prepare(`
    INSERT INTO grocery_items (ingredient_id, total_amount, unit, is_purchased)
    VALUES (@ingredient_id, @total_amount, @unit, 0)
    ON CONFLICT(ingredient_id) DO UPDATE SET
      total_amount = excluded.total_amount,
      unit = excluded.unit
  `);

  const remove = db.prepare(`
    DELETE FROM grocery_items WHERE ingredient_id NOT IN (${
      totals.size > 0 ? Array.from(totals.keys()).join(',') : '-1'
    })
  `);

  const rebuild = db.transaction(() => {
    for (const [ingredient_id, { total_amount, unit }] of totals) {
      upsert.run({ ingredient_id, total_amount, unit });
    }
    remove.run();
    if (totals.size === 0) {
      db.prepare('DELETE FROM grocery_items').run();
    }
  });

  rebuild();
}

export function getGroceryList(category?: string, store?: string) {
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
    WHERE 1=1
  `;
  const params: (string | number)[] = [];

  if (category) {
    sql += ' AND i.category = ?';
    params.push(category);
  }
  if (store) {
    sql += ' AND s.id = ?';
    params.push(Number(store));
  }

  sql += ' ORDER BY gi.is_purchased ASC, i.name ASC';
  return db.prepare(sql).all(...params);
}

export function togglePurchased(id: number) {
  db.prepare(`
    UPDATE grocery_items SET is_purchased = CASE WHEN is_purchased = 1 THEN 0 ELSE 1 END WHERE id = ?
  `).run(id);
  return db.prepare('SELECT * FROM grocery_items WHERE id = ?').get(id);
}
