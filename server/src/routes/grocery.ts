import { Router } from 'express';
import { getGroceryList, rebuildGroceryList, togglePurchased } from '../models/GroceryItem';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { category, store } = req.query as { category?: string; store?: string };
    res.json(await getGroceryList(category, store));
  } catch (e) { next(e); }
});

router.post('/rebuild', async (_req, res, next) => {
  try {
    await rebuildGroceryList();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.patch('/:id/purchase', async (req, res, next) => {
  try {
    const item = await togglePurchased(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (e) { next(e); }
});

export default router;
