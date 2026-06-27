import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(400).json({ error: 'Bu e-posta zaten kayıtlı' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, role: 'parent' },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role as 'parent' | 'admin' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    res.status(500).json({ error: 'Kayıt başarısız' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }
    const token = signToken({ userId: user.id, email: user.email, role: user.role as 'parent' | 'admin' });
    res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    res.status(500).json({ error: 'Giriş başarısız' });
  }
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, role: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
  res.json(user);
});

export default router;
