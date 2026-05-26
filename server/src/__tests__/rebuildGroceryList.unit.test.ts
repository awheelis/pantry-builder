jest.mock('../db/connection', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Database = require('better-sqlite3');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  const schema = fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8');
  db.exec(schema);
  return { __esModule: true, default: db };
});

import db from '../db/connection';
import { rebuildGroceryList } from '../models/GroceryItem';

function seedIngredient(name: string, category = 'dry', unit = 'cups') {
  return db.prepare('INSERT INTO ingredients (name, category, unit) VALUES (?, ?, ?)').run(name, category, unit).lastInsertRowid as number;
}
function seedRecipe(name: string) {
  return db.prepare('INSERT INTO recipes (name, serving_size) VALUES (?, 4)').run(name).lastInsertRowid as number;
}
function seedRI(recipeId: number, ingredientId: number, amount: number, unit = 'cups') {
  db.prepare('INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount, unit) VALUES (?, ?, ?, ?)').run(recipeId, ingredientId, amount, unit);
}
function seedStaged(recipeId: number, scaleFactor = 1.0) {
  return db.prepare('INSERT INTO staged_recipes (recipe_id, scale_factor) VALUES (?, ?)').run(recipeId, scaleFactor).lastInsertRowid as number;
}

afterEach(() => {
  db.prepare('DELETE FROM grocery_items').run();
  db.prepare('DELETE FROM staged_recipes').run();
  db.prepare('DELETE FROM recipe_ingredients').run();
  db.prepare('DELETE FROM recipes').run();
  db.prepare('DELETE FROM ingredients').run();
});

it('produces no grocery items when nothing is staged', () => {
  rebuildGroceryList();
  expect(db.prepare('SELECT * FROM grocery_items').all()).toHaveLength(0);
});

it('creates one grocery item per unique ingredient', () => {
  const flourId = seedIngredient('Flour');
  const sugarId = seedIngredient('Sugar');
  const recipeId = seedRecipe('Cake');
  seedRI(recipeId, flourId, 2);
  seedRI(recipeId, sugarId, 1);
  seedStaged(recipeId);

  rebuildGroceryList();
  expect(db.prepare('SELECT * FROM grocery_items').all()).toHaveLength(2);
});

it('multiplies amounts by scale_factor', () => {
  const flourId = seedIngredient('Flour');
  const recipeId = seedRecipe('Big Cake');
  seedRI(recipeId, flourId, 2);
  seedStaged(recipeId, 3);

  rebuildGroceryList();
  const item = db.prepare('SELECT total_amount FROM grocery_items').get() as { total_amount: number };
  expect(item.total_amount).toBe(6);
});

it('aggregates same ingredient across two staged recipes with same unit', () => {
  const flourId = seedIngredient('Flour');
  const r1 = seedRecipe('Bread');
  const r2 = seedRecipe('Cake');
  seedRI(r1, flourId, 2);
  seedRI(r2, flourId, 1.5);
  seedStaged(r1);
  seedStaged(r2);

  rebuildGroceryList();
  const item = db.prepare('SELECT total_amount FROM grocery_items').get() as { total_amount: number };
  expect(item.total_amount).toBeCloseTo(3.5);
});

it('preserves is_purchased=1 when rebuilding with updated amount', () => {
  const flourId = seedIngredient('Flour');
  const recipeId = seedRecipe('Bread');
  seedRI(recipeId, flourId, 2);
  const stagedId = seedStaged(recipeId, 1);

  rebuildGroceryList();
  db.prepare('UPDATE grocery_items SET is_purchased = 1 WHERE ingredient_id = ?').run(flourId);

  db.prepare('UPDATE staged_recipes SET scale_factor = 2 WHERE id = ?').run(stagedId);
  rebuildGroceryList();

  const item = db.prepare('SELECT is_purchased, total_amount FROM grocery_items WHERE ingredient_id = ?').get(flourId) as { is_purchased: number; total_amount: number };
  expect(item.is_purchased).toBe(1);
  expect(item.total_amount).toBe(4);
});

it('removes items for ingredients no longer needed after unstaging', () => {
  const flourId = seedIngredient('Flour');
  const milkId = seedIngredient('Milk', 'dairy', 'gallons');
  const r1 = seedRecipe('Bread');
  const r2 = seedRecipe('Milkshake');
  seedRI(r1, flourId, 2);
  seedRI(r2, milkId, 1);
  const s1 = seedStaged(r1);
  seedStaged(r2);

  rebuildGroceryList();
  expect(db.prepare('SELECT * FROM grocery_items').all()).toHaveLength(2);

  db.prepare('DELETE FROM staged_recipes WHERE id = ?').run(s1);
  rebuildGroceryList();

  const items = db.prepare('SELECT ingredient_id FROM grocery_items').all() as Array<{ ingredient_id: number }>;
  expect(items).toHaveLength(1);
  expect(items[0].ingredient_id).toBe(milkId);
});

it('handles fractional scale factors correctly', () => {
  const flourId = seedIngredient('Flour');
  const recipeId = seedRecipe('Half Bread');
  seedRI(recipeId, flourId, 4);
  seedStaged(recipeId, 0.5);

  rebuildGroceryList();
  const item = db.prepare('SELECT total_amount FROM grocery_items').get() as { total_amount: number };
  expect(item.total_amount).toBe(2);
});

it('is idempotent — calling twice yields the same result', () => {
  const flourId = seedIngredient('Flour');
  const recipeId = seedRecipe('Bread');
  seedRI(recipeId, flourId, 2);
  seedStaged(recipeId);

  rebuildGroceryList();
  rebuildGroceryList();

  const items = db.prepare('SELECT * FROM grocery_items').all();
  expect(items).toHaveLength(1);
  expect((items[0] as { total_amount: number }).total_amount).toBe(2);
});
