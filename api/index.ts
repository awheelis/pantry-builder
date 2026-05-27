import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../server/src/app';
import { migrate } from '../server/src/db/migrate';

const app = createApp();

// Run migration once per cold start; IF NOT EXISTS keeps it idempotent
const ready = migrate().catch(err => console.error('[migrate]', err));

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await ready;
  return app(req as any, res as any);
}
