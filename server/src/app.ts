import express from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import storesRouter from './routes/stores';
import ingredientsRouter from './routes/ingredients';
import recipesRouter from './routes/recipes';
import stagedRouter from './routes/staged';
import groceryRouter from './routes/grocery';
import customGroceryRouter from './routes/customGrocery';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/stores', storesRouter);
  app.use('/api/ingredients', ingredientsRouter);
  app.use('/api/recipes', recipesRouter);
  app.use('/api/staged', stagedRouter);
  app.use('/api/grocery/custom', customGroceryRouter);
  app.use('/api/grocery', groceryRouter);
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
