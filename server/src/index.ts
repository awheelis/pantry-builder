import express from 'express';
import cors from 'cors';
import path from 'path';
import { migrate } from './db/migrate';
import { errorHandler } from './middleware/errorHandler';
import storesRouter from './routes/stores';
import ingredientsRouter from './routes/ingredients';
import recipesRouter from './routes/recipes';
import stagedRouter from './routes/staged';
import groceryRouter from './routes/grocery';

migrate();

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/stores', storesRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/recipes', recipesRouter);
app.use('/api/staged', stagedRouter);
app.use('/api/grocery', groceryRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
