import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateDeviceToken, signDeviceToken } from '../lib/jwt';
import { requireAuth, requireDevice, AuthRequest } from '../middleware/auth';

const router = Router();

const registerDeviceSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceName: z.string().min(1),
  androidId: z.string().min(1),
  apkVersion: z.string().optional(),
});

router.post('/register', async (req, res) => {
  try {
    const data = registerDeviceSchema.parse(req.body);
    const normalizedEmail = data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
    }

    const deviceToken = generateDeviceToken();
    const existing = await prisma.device.findUnique({ where: { androidId: data.androidId } });

    let device;
    if (existing) {
      device = await prisma.device.update({
        where: { id: existing.id },
        data: {
          userId: user.id,
          deviceName: data.deviceName,
          deviceToken,
          apkVersion: data.apkVersion || '1.0.0',
          lastSeen: new Date(),
          isActive: true,
        },
      });
    } else {
      device = await prisma.device.create({
        data: {
          userId: user.id,
          deviceName: data.deviceName,
          androidId: data.androidId,
          deviceToken,
          apkVersion: data.apkVersion || '1.0.0',
          lastSeen: new Date(),
        },
      });
    }

    const jwtToken = signDeviceToken(device.id);
    res.status(201).json({
      deviceId: device.id,
      deviceToken: jwtToken,
      userId: user.id,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error(e);
    res.status(500).json({ error: 'Cihaz kaydı başarısız' });
  }
});

router.post('/heartbeat', requireDevice, async (req: AuthRequest, res) => {
  await prisma.device.update({
    where: { id: req.deviceId },
    data: { lastSeen: new Date() },
  });
  res.json({ ok: true });
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const where = req.user!.role === 'admin' ? {} : { userId: req.user!.userId };
  const devices = await prisma.device.findMany({
    where,
    orderBy: { lastSeen: 'desc' },
    include: { user: { select: { email: true } } },
  });
  res.json(devices);
});

router.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  const device = await prisma.device.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { email: true } } },
  });
  if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });
  if (req.user!.role !== 'admin' && device.userId !== req.user!.userId) {
    return res.status(403).json({ error: 'Erişim reddedildi' });
  }
  res.json(device);
});

export default router;
