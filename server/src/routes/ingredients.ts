import { Router } from 'express';
import * as Ingredient from '../models/Ingredient';

const router = Router();

router.get('/', (req, res) => {
  const { category, store } = req.query as { category?: string; store?: string };
  res.json(Ingredient.listIngredients(category, store));
});

router.post('/', (req, res) => {
  const { name, category, unit, suggested_purchase_location } = req.body;
  if (!name?.trim() || !category || !unit?.trim()) {
    return res.status(400).json({ error: 'name, category, and unit are required' });
  }
  res.status(201).json(Ingredient.createIngredient({
    name: name.trim(),
    category,
    unit: unit.trim(),
    suggested_purchase_location: suggested_purchase_location ?? null,
  }));
});

router.put('/:id', (req, res) => {
  const allowed = ['name', 'category', 'unit', 'suggested_purchase_location'];
  const data = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'no valid fields' });
  res.json(Ingredient.updateIngredient(Number(req.params.id), data));
});

router.delete('/:id', (req, res) => {
  Ingredient.deleteIngredient(Number(req.params.id));
  res.status(204).send();
});

export default router;
