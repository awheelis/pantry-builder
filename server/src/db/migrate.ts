import fs from 'fs';
import path from 'path';
import db from './connection';

export function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
}
