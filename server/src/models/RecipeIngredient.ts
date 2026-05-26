import db from '../db/connection';

export function listRecipeIngredients(recipeId: number) {
  return db.prepare(`
    SELECT
      ri.*,
      i.name AS ingredient_name,
      i.category,
      i.unit AS default_unit,
      orig.name AS original_ingredient_name
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    WHERE ri.recipe_id = ?
    ORDER BY i.name ASC
  `).all(recipeId);
}

export function addRecipeIngredient(recipeId: number, data: {
  ingredient_id: number;
  amount: number;
  unit: string;
}) {
  const result = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit)
    VALUES (@recipe_id, @ingredient_id, @amount, @unit)
  `).run({ recipe_id: recipeId, ...data });
  return db.prepare('SELECT * FROM recipe_ingredients WHERE id = ?').get(result.lastInsertRowid);
}

export function updateRecipeIngredient(id: number, data: {
  amount?: number;
  unit?: string;
}) {
  const fields = Object.keys(data).map(k => `${k} = @${k}`).join(', ');
  db.prepare(`UPDATE recipe_ingredients SET ${fields} WHERE id = @id`).run({ ...data, id });
  return db.prepare('SELECT * FROM recipe_ingredients WHERE id = ?').get(id);
}

export function removeRecipeIngredient(id: number) {
  db.prepare('DELETE FROM recipe_ingredients WHERE id = ?').run(id);
}

export function substituteIngredient(id: number, newIngredientId: number) {
  const current = db.prepare('SELECT * FROM recipe_ingredients WHERE id = ?').get(id) as {
    ingredient_id: number;
    is_substituted: number;
    original_ingredient_id: number | null;
  } | undefined;

  if (!current) return null;

  const originalId = current.is_substituted
    ? current.original_ingredient_id
    : current.ingredient_id;

  db.prepare(`
    UPDATE recipe_ingredients
    SET ingredient_id = ?, is_substituted = 1, original_ingredient_id = ?
    WHERE id = ?
  `).run(newIngredientId, originalId, id);

  return db.prepare(`
    SELECT ri.*, i.name AS ingredient_name, orig.name AS original_ingredient_name
    FROM recipe_ingredients ri
    JOIN ingredients i ON i.id = ri.ingredient_id
    LEFT JOIN ingredients orig ON orig.id = ri.original_ingredient_id
    WHERE ri.id = ?
  `).get(id);
}

export function revertSubstitution(id: number) {
  const current = db.prepare('SELECT * FROM recipe_ingredients WHERE id = ?').get(id) as {
    original_ingredient_id: number | null;
  } | undefined;

  if (!current?.original_ingredient_id) return null;

  db.prepare(`
    UPDATE recipe_ingredients
    SET ingredient_id = ?, is_substituted = 0, original_ingredient_id = NULL
    WHERE id = ?
  `).run(current.original_ingredient_id, id);

  return db.prepare('SELECT * FROM recipe_ingredients WHERE id = ?').get(id);
}
