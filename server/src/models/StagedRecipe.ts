import db from '../db/connection';

export function listStaged() {
  return db.prepare(`
    SELECT sr.*, r.name AS recipe_name, r.serving_size, r.ease_rating, r.deliciousness_rating
    FROM staged_recipes sr
    JOIN recipes r ON r.id = sr.recipe_id
    ORDER BY r.name ASC
  `).all();
}

export function stageRecipe(recipeId: number) {
  const existing = db.prepare('SELECT * FROM staged_recipes WHERE recipe_id = ?').get(recipeId);
  if (existing) return existing;
  const result = db.prepare('INSERT INTO staged_recipes (recipe_id) VALUES (?)').run(recipeId);
  return db.prepare('SELECT * FROM staged_recipes WHERE id = ?').get(result.lastInsertRowid);
}

export function updateScaleFactor(id: number, scaleFactor: number) {
  db.prepare('UPDATE staged_recipes SET scale_factor = ? WHERE id = ?').run(scaleFactor, id);
  return db.prepare('SELECT * FROM staged_recipes WHERE id = ?').get(id);
}

export function unstageRecipe(id: number) {
  db.prepare('DELETE FROM staged_recipes WHERE id = ?').run(id);
}

export function clearStaged() {
  db.prepare('DELETE FROM staged_recipes').run();
}

export function getBreakdown(stagedId: number) {
  const staged = db.prepare('SELECT * FROM staged_recipes WHERE id = ?').get(stagedId) as {
    recipe_id: number;
    scale_factor: number;
  } | undefined;

  if (!staged) return null;

  const rows = db.prepare(`
    SELECT
      ri.id AS ri_id,
      ri.ingredient_id,
      i.name AS ingredient_name,
      i.category,
      ROUND(ri.amount * ?, 4) AS scaled_amount,
      ri.unit,
      ri.is_substituted,
      ri.original_ingredient_id,
      orig.name AS original_ingredient_name,
      gi.is_purchased,
      gi.total_amount AS grocery_total
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    LEFT JOIN grocery_items gi ON gi.ingredient_id = ri.ingredient_id
    WHERE ri.recipe_id = ?
    ORDER BY i.name ASC
  `).all(staged.scale_factor, staged.recipe_id) as Array<{ is_purchased: number }>;

  const total = rows.length;
  const purchased = rows.filter(r => r.is_purchased === 1).length;
  const progress = total > 0 ? Math.round((purchased / total) * 100) : 0;

  return { staged_id: stagedId, progress, ingredients: rows };
}
