import { Router } from 'express';
import * as Recipe from '../models/Recipe';
import * as RI from '../models/RecipeIngredient';

const router = Router();

router.get('/', (req, res) => {
  res.json(Recipe.listRecipes(req.query.q as string | undefined));
});

router.get('/:id', (req, res) => {
  const recipe = Recipe.getRecipe(Number(req.params.id));
  if (!recipe) return res.status(404).json({ error: 'not found' });
  const ingredients = RI.listRecipeIngredients(Number(req.params.id));
  res.json({ ...recipe as object, ingredients });
});

router.post('/', (req, res) => {
  const { name, description, serving_size, ease_rating, deliciousness_rating } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  res.status(201).json(Recipe.createRecipe({
    name: name.trim(),
    description: description ?? null,
    serving_size: Number(serving_size) || 1,
    ease_rating: ease_rating ?? null,
    deliciousness_rating: deliciousness_rating ?? null,
  }));
});

router.put('/:id', (req, res) => {
  const allowed = ['name', 'description', 'serving_size', 'ease_rating', 'deliciousness_rating'];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
  res.json(Recipe.updateRecipe(Number(req.params.id), data));
});

router.delete('/:id', (req, res) => {
  Recipe.deleteRecipe(Number(req.params.id));
  res.status(204).send();
});

// Recipe ingredients nested routes
router.get('/:id/ingredients', (req, res) => {
  res.json(RI.listRecipeIngredients(Number(req.params.id)));
});

router.post('/:id/ingredients', (req, res) => {
  const { ingredient_id, amount, unit } = req.body;
  if (!ingredient_id || amount == null || !unit?.trim()) {
    return res.status(400).json({ error: 'ingredient_id, amount, and unit are required' });
  }
  res.status(201).json(RI.addRecipeIngredient(Number(req.params.id), {
    ingredient_id: Number(ingredient_id),
    amount: Number(amount),
    unit: unit.trim(),
  }));
});

router.put('/:id/ingredients/:riId', (req, res) => {
  const data: Record<string, unknown> = {};
  if (req.body.amount != null) data.amount = Number(req.body.amount);
  if (req.body.unit != null) data.unit = req.body.unit;
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
  res.json(RI.updateRecipeIngredient(Number(req.params.riId), data));
});

router.delete('/:id/ingredients/:riId', (req, res) => {
  RI.removeRecipeIngredient(Number(req.params.riId));
  res.status(204).send();
});

router.post('/:id/ingredients/:riId/substitute', (req, res, next) => {
  const { new_ingredient_id } = req.body;
  if (!new_ingredient_id) return res.status(400).json({ error: 'new_ingredient_id is required' });
  try {
    const updated = RI.substituteIngredient(Number(req.params.riId), Number(new_ingredient_id));
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/:id/ingredients/:riId/revert', (req, res, next) => {
  try {
    const updated = RI.revertSubstitution(Number(req.params.riId));
    if (!updated) return res.status(404).json({ error: 'not found or no substitution to revert' });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
