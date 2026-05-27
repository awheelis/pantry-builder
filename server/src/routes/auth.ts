import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByEmail, createUser } from '../models/User';
import { requireAuth } from '../middleware/auth';

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

export default router;
