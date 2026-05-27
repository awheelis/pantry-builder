import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import { requireAuth } from './middleware/auth';
import authRouter from './routes/auth';
import storesRouter from './routes/stores';
import ingredientsRouter from './routes/ingredients';
import recipesRouter from './routes/recipes';
import stagedRouter from './routes/staged';
import groceryRouter from './routes/grocery';
import customGroceryRouter from './routes/customGrocery';

export function createApp() {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Auth routes — no token required
  app.use('/api/auth', authRouter);

  // All other /api/* routes require a valid JWT cookie
  app.use('/api', requireAuth);
  app.use('/api/grocery/custom', customGroceryRouter);
  app.use('/api/grocery', groceryRouter);
  app.use('/api/stores', storesRouter);
  app.use('/api/ingredients', ingredientsRouter);
  app.use('/api/recipes', recipesRouter);
  app.use('/api/staged', stagedRouter);

  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }
  app.use(errorHandler);
  return app;
}
