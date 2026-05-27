import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Resend } from 'resend';
import { findByEmail, createUser } from '../models/User';
import { requireAuth } from '../middleware/auth';
import pool from '../db/connection';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function makeToken(id: number, email: string) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'password must be at least 6 characters' });
    }
    if (await findByEmail(email)) {
      return res.status(409).json({ error: 'email already in use' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await createUser(email.trim(), hash);
    res.cookie('token', makeToken(user.id, user.email), COOKIE_OPTS);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await findByEmail(email.trim());
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    res.cookie('token', makeToken(user.id, user.email), COOKIE_OPTS);
    res.json({ id: user.id, email: user.email });
  } catch (e) { next(e); }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user);
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = email ? await findByEmail(email.trim()) : null;
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
        [user.id, token]
      );
      const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.RESEND_FROM ?? 'noreply@resend.dev',
        to: user.email,
        subject: 'Reset your Pantry Builder password',
        html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
               <p><a href="${appUrl}?reset_token=${token}">Reset password</a></p>
               <p>If you didn't request this, ignore this email.</p>`,
      });
    }
    // Always return ok to avoid email enumeration
    res.json({ ok: true });
  } catch (e) { console.error('[forgot-password]', e); next(e); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password || password.length < 6) {
      return res.status(400).json({ error: 'Token and password (min 6 chars) are required' });
    }
    const { rows } = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1`,
      [token]
    );
    const row = rows[0];
    if (!row || row.used || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token is invalid or has expired' });
    }
    const hash = await bcrypt.hash(password, 10);
    await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, row.user_id]);
    await pool.query(`UPDATE password_reset_tokens SET used = TRUE WHERE id = $1`, [row.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
