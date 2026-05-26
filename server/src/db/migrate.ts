import fs from 'fs';
import path from 'path';
import pool from './connection';

export async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  // Split on semicolons and run each statement individually
  const statements = schema.split(';').map(s => s.trim()).filter(Boolean);
  for (const sql of statements) {
    await pool.query(sql);
  }
  console.log('[db] schema applied');
}
