import { Router } from 'express';
import { listCustomItems, addCustomItem, toggleCustomItem, deleteCustomItem } from '../models/CustomGroceryItem';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { res.json(await listCustomItems()); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(await addCustomItem(name));
  } catch (e) { next(e); }
});

router.patch('/:id/purchase', async (req, res, next) => {
  try {
    const item = await toggleCustomItem(Number(req.params.id));
    if (!item) return res.status(404).json({ error: 'not found' });
    res.json(item);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteCustomItem(Number(req.params.id));
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
