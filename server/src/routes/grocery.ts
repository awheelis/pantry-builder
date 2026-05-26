import { Router } from 'express';
import { getGroceryList, rebuildGroceryList, togglePurchased } from '../models/GroceryItem';

const router = Router();

router.get('/', (req, res) => {
  const { category, store } = req.query as { category?: string; store?: string };
  res.json(getGroceryList(category, store));
});

router.post('/rebuild', (_req, res, next) => {
  try {
    rebuildGroceryList();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.patch('/:id/purchase', (req, res, next) => {
  try {
    const item = togglePurchased(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (e) { next(e); }
});

export default router;
