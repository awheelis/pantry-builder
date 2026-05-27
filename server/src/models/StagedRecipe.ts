import pool from '../db/connection';

export async function listStaged(userId: number) {
  const { rows } = await pool.query(`
    SELECT sr.*, r.name AS recipe_name, r.serving_size, r.ease_rating, r.deliciousness_rating
    FROM staged_recipes sr
    JOIN recipes r ON r.id = sr.recipe_id
    WHERE sr.user_id = $1
    ORDER BY r.name ASC
  `, [userId]);
  return rows;
}

export async function stageRecipe(recipeId: number, userId: number) {
  const { rows: existing } = await pool.query(
    'SELECT * FROM staged_recipes WHERE recipe_id = $1 AND user_id = $2',
    [recipeId, userId]
  );
  if (existing[0]) return existing[0];
  const { rows } = await pool.query(
    'INSERT INTO staged_recipes (recipe_id, user_id) VALUES ($1, $2) RETURNING *',
    [recipeId, userId]
  );
  return rows[0];
}

export async function updateScaleFactor(id: number, scaleFactor: number, userId: number) {
  const { rows } = await pool.query(
    'UPDATE staged_recipes SET scale_factor = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
    [scaleFactor, id, userId]
  );
  return rows[0];
}

export async function unstageRecipe(id: number, userId: number) {
  await pool.query('DELETE FROM staged_recipes WHERE id = $1 AND user_id = $2', [id, userId]);
}

export async function clearStaged(userId: number) {
  await pool.query('DELETE FROM staged_recipes WHERE user_id = $1', [userId]);
}

export async function getBreakdown(stagedId: number, userId: number) {
  const { rows: sr } = await pool.query(
    'SELECT * FROM staged_recipes WHERE id = $1 AND user_id = $2',
    [stagedId, userId]
  );
  if (!sr[0]) return null;
  const { recipe_id, scale_factor } = sr[0] as { recipe_id: number; scale_factor: number };

  const { rows } = await pool.query(`
    SELECT
      ri.id AS ri_id,
      ri.ingredient_id,
      i.name AS ingredient_name,
      i.category,
      ROUND((ri.amount * $1)::numeric, 4) AS scaled_amount,
      ri.unit,
      ri.is_substituted,
      ri.original_ingredient_id,
      orig.name AS original_ingredient_name,
      gi.is_purchased,
      gi.total_amount AS grocery_total
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    LEFT JOIN grocery_items gi ON gi.ingredient_id = ri.ingredient_id AND gi.user_id = $3
    WHERE ri.recipe_id = $2
    ORDER BY i.name ASC
  `, [scale_factor, recipe_id, userId]);

  const total = rows.length;
  const purchased = rows.filter((r: { is_purchased: number }) => Number(r.is_purchased) === 1).length;
  const progress = total > 0 ? Math.round((purchased / total) * 100) : 0;

  return { staged_id: stagedId, progress, ingredients: rows };
}
