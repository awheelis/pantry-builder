import { Router } from 'express';
import * as Staged from '../models/StagedRecipe';
import { rebuildGroceryList } from '../models/GroceryItem';

const router = Router();

router.get('/', (_req, res) => res.json(Staged.listStaged()));

router.post('/', (req, res, next) => {
  const { recipe_id } = req.body;
  if (!recipe_id) return res.status(400).json({ error: 'recipe_id is required' });
  try {
    const staged = Staged.stageRecipe(Number(recipe_id));
    rebuildGroceryList();
    res.status(201).json(staged);
  } catch (e) { next(e); }
});

router.put('/:id', (req, res, next) => {
  const { scale_factor } = req.body;
  if (scale_factor == null || Number(scale_factor) <= 0) {
    return res.status(400).json({ error: 'scale_factor must be a positive number' });
  }
  try {
    const updated = Staged.updateScaleFactor(Number(req.params.id), Number(scale_factor));
    rebuildGroceryList();
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', (req, res, next) => {
  try {
    Staged.unstageRecipe(Number(req.params.id));
    rebuildGroceryList();
    res.status(204).send();
  } catch (e) { next(e); }
});

router.delete('/', (_req, res, next) => {
  try {
    Staged.clearStaged();
    rebuildGroceryList();
    res.status(204).send();
  } catch (e) { next(e); }
});

router.get('/:id/breakdown', (req, res) => {
  const result = Staged.getBreakdown(Number(req.params.id));
  if (!result) return res.status(404).json({ error: 'not found' });
  res.json(result);
});

export default router;
