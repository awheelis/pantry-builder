import { Router } from 'express';
import * as Staged from '../models/StagedRecipe';
import { rebuildGroceryList } from '../models/GroceryItem';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await Staged.listStaged()); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { recipe_id } = req.body;
    if (!recipe_id) return res.status(400).json({ error: 'recipe_id is required' });
    const staged = await Staged.stageRecipe(Number(recipe_id));
    await rebuildGroceryList();
    res.status(201).json(staged);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { scale_factor } = req.body;
    if (scale_factor == null || Number(scale_factor) <= 0) {
      return res.status(400).json({ error: 'scale_factor must be a positive number' });
    }
    const updated = await Staged.updateScaleFactor(Number(req.params.id), Number(scale_factor));
    await rebuildGroceryList();
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Staged.unstageRecipe(Number(req.params.id));
    await rebuildGroceryList();
    res.status(204).send();
  } catch (e) { next(e); }
});

router.delete('/', async (_req, res, next) => {
  try {
    await Staged.clearStaged();
    await rebuildGroceryList();
    res.status(204).send();
  } catch (e) { next(e); }
});

router.get('/:id/breakdown', async (req, res, next) => {
  try {
    const result = await Staged.getBreakdown(Number(req.params.id));
    if (!result) return res.status(404).json({ error: 'not found' });
    res.json(result);
  } catch (e) { next(e); }
});

export default router;
