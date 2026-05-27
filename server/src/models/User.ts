import pool from '../db/connection';

export interface User {
  id: number;
  email: string;
  password_hash: string;
}

export async function findByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  return rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING *',
    [email.toLowerCase(), passwordHash]
  );
  return rows[0];
}
