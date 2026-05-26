import { migrate } from './db/migrate';
import { createApp } from './app';

migrate();

const app = createApp();
const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
