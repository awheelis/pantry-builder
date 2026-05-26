import { migrate } from './db/migrate';
import { createApp } from './app';

async function main() {
  await migrate();
  const app = createApp();
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
