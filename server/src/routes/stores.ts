import { Router } from 'express';
import * as Store from '../models/Store';

const router = Router();

router.get('/', (_req, res) => res.json(Store.listStores()));

router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  res.status(201).json(Store.createStore(name.trim()));
});

router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  res.json(Store.updateStore(Number(req.params.id), name.trim()));
});

router.delete('/:id', (req, res) => {
  Store.deleteStore(Number(req.params.id));
  res.status(204).send();
});

export default router;
