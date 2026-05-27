import { Router } from 'express';
import * as Store from '../models/Store';

const router = Router();

router.get('/', async (req, res, next) => {
  try { res.json(await Store.listStores(req.user!.id)); } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    res.status(201).json(await Store.createStore(name.trim(), req.user!.id));
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
    res.json(await Store.updateStore(Number(req.params.id), name.trim(), req.user!.id));
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await Store.deleteStore(Number(req.params.id), req.user!.id);
    res.status(204).send();
  } catch (e) { next(e); }
});

export default router;
