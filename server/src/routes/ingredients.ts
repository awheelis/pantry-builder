import { Router } from 'express';
import * as Ingredient from '../models/Ingredient';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, store } = req.query as { category?: string; store?: string };
    res.json(await Ingredient.listIngredients(category, store));
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, category, unit, suggested_purchase_location } = req.body;
    if (!name?.trim() || !category || !unit?.trim()) {
      return res.status(400).json({ error: 'name, category, and unit are required' });
    }
    res.status(201).json(await Ingredient.createIngredient({
      name: name.trim(),
      category,
      unit: unit.trim(),
      suggested_purchase_location: suggested_purchase_location ?? null,
    }));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'category', 'unit', 'suggested_purchase_location'];
    const data = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );
    if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
    res.json(await Ingredient.updateIngredient(Number(req.params.id), data));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Ingredient.deleteIngredient(Number(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
