import pool from '../db/connection';

export async function listRecipeIngredients(recipeId: number) {
  const { rows } = await pool.query(`
    SELECT
      ri.*,
      i.name AS ingredient_name,
      i.category,
      i.unit AS default_unit,
      orig.name AS original_ingredient_name
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    WHERE ri.recipe_id = $1
    ORDER BY i.name ASC
  `, [recipeId]);
  return rows;
}

export async function addRecipeIngredient(recipeId: number, data: {
  ingredient_id: number;
  amount: number;
  unit: string;
}) {
  const { rows } = await pool.query(
    `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [recipeId, data.ingredient_id, data.amount, data.unit]
  );
  return rows[0];
}

export async function updateRecipeIngredient(id: number, data: { amount?: number; unit?: string }) {
  const keys = Object.keys(data);
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
  const values = [...Object.values(data), id];
  const { rows } = await pool.query(
    `UPDATE recipe_ingredients SET ${sets} WHERE id = $${keys.length + 1} RETURNING *`,
    values
  );
  return rows[0];
}

export async function removeRecipeIngredient(id: number) {
  await pool.query('DELETE FROM recipe_ingredients WHERE id = $1', [id]);
}

export async function substituteIngredient(id: number, newIngredientId: number) {
  const { rows: curr } = await pool.query(
    'SELECT ingredient_id, is_substituted, original_ingredient_id FROM recipe_ingredients WHERE id = $1',
    [id]
  );
  if (!curr[0]) return null;
  const current = curr[0] as { ingredient_id: number; is_substituted: number; original_ingredient_id: number | null };
  const originalId = current.is_substituted ? current.original_ingredient_id : current.ingredient_id;

  await pool.query(
    `UPDATE recipe_ingredients
     SET ingredient_id = $1, is_substituted = 1, original_ingredient_id = $2
     WHERE id = $3`,
    [newIngredientId, originalId, id]
  );

  const { rows } = await pool.query(`
    SELECT ri.*, i.name AS ingredient_name, orig.name AS original_ingredient_name
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    WHERE ri.id = $1
  `, [id]);
  return rows[0];
}

export async function revertSubstitution(id: number) {
  const { rows: curr } = await pool.query(
    'SELECT original_ingredient_id FROM recipe_ingredients WHERE id = $1',
    [id]
  );
  if (!curr[0]?.original_ingredient_id) return null;

  await pool.query(
    `UPDATE recipe_ingredients
     SET ingredient_id = $1, is_substituted = 0, original_ingredient_id = NULL
     WHERE id = $2`,
    [curr[0].original_ingredient_id, id]
  );

  const { rows } = await pool.query('SELECT * FROM recipe_ingredients WHERE id = $1', [id]);
  return rows[0];
}
