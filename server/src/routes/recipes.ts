import { Router } from 'express';
import * as Recipe from '../models/Recipe';
import * as RI from '../models/RecipeIngredient';

const router = Router();

router.get('/', async (req, res, next) => {
  try { res.json(await Recipe.listRecipes(req.query.q as string | undefined)); } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const recipe = await Recipe.getRecipe(Number(req.params.id));
    if (!recipe) return res.status(404).json({ error: 'not found' });
    const ingredients = await RI.listRecipeIngredients(Number(req.params.id));
    res.json({ ...recipe, ingredients });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description, serving_size, ease_rating, deliciousness_rating } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(await Recipe.createRecipe({
      name: name.trim(),
      description: description ?? null,
      serving_size: Number(serving_size) || 1,
      ease_rating: ease_rating ?? null,
      deliciousness_rating: deliciousness_rating ?? null,
    }));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'description', 'serving_size', 'ease_rating', 'deliciousness_rating'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
    res.json(await Recipe.updateRecipe(Number(req.params.id), data));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Recipe.deleteRecipe(Number(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

router.get('/:id/ingredients', async (req, res, next) => {
  try { res.json(await RI.listRecipeIngredients(Number(req.params.id))); } catch (e) { next(e); }
});

router.post('/:id/ingredients', async (req, res, next) => {
  try {
    const { ingredient_id, amount, unit } = req.body;
    if (!ingredient_id || amount == null || !unit?.trim()) {
      return res.status(400).json({ error: 'ingredient_id, amount, and unit are required' });
    }
    res.status(201).json(await RI.addRecipeIngredient(Number(req.params.id), {
      ingredient_id: Number(ingredient_id),
      amount: Number(amount),
      unit: unit.trim(),
    }));
  } catch (e) { next(e); }
});

router.put('/:id/ingredients/:riId', async (req, res, next) => {
  try {
    const data: Record<string, unknown> = {};
    if (req.body.amount != null) data.amount = Number(req.body.amount);
    if (req.body.unit != null) data.unit = req.body.unit;
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
    res.json(await RI.updateRecipeIngredient(Number(req.params.riId), data));
  } catch (e) { next(e); }
});

router.delete('/:id/ingredients/:riId', async (req, res, next) => {
  try {
    await RI.removeRecipeIngredient(Number(req.params.riId));
    res.status(204).send();
  } catch (e) { next(e); }
});

router.post('/:id/ingredients/:riId/substitute', async (req, res, next) => {
  try {
    const { new_ingredient_id } = req.body;
    if (!new_ingredient_id) return res.status(400).json({ error: 'new_ingredient_id is required' });
    const updated = await RI.substituteIngredient(Number(req.params.riId), Number(new_ingredient_id));
    if (!updated) return res.status(404).json({ error: 'not found' });
    res.json(updated);
  } catch (e) { next(e); }
});

router.post('/:id/ingredients/:riId/revert', async (req, res, next) => {
  try {
    const updated = await RI.revertSubstitution(Number(req.params.riId));
    if (!updated) return res.status(404).json({ error: 'not found or no substitution to revert' });
    res.json(updated);
  } catch (e) { next(e); }
});

export default router;
