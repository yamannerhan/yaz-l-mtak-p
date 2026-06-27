import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAdmin } from '../middleware/auth';
import { extendSubscription } from '../lib/subscription';

const router = Router();

router.get('/stats', requireAdmin, async (_req, res) => {
  const [userCount, deviceCount, activeDevices, callCount, smsCount, notificationCount] =
    await Promise.all([
      prisma.user.count({ where: { role: 'parent' } }),
      prisma.device.count(),
      prisma.device.count({
        where: { lastSeen: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
      prisma.callLog.count(),
      prisma.smsMessage.count(),
      prisma.notification.count(),
    ]);
  res.json({ userCount, deviceCount, activeDevices, callCount, smsCount, notificationCount });
});

router.get('/users', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      subscriptionPlan: true,
      subscriptionExpiresAt: true,
      menuPin: true,
      createdAt: true,
      _count: { select: { devices: true } },
    },
  });
  res.json(users);
});

router.post('/users', requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(['parent', 'admin']).default('parent'),
      subscriptionPlan: z.enum(['trial', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime']).default('trial'),
      menuPin: z.string().min(4).max(8).optional(),
    });
    const { email, password, role, subscriptionPlan, menuPin } = schema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'E-posta zaten kayıtlı' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        subscriptionPlan,
        subscriptionExpiresAt: extendSubscription(subscriptionPlan),
        menuPin: menuPin || '8255',
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        menuPin: true,
        createdAt: true,
      },
    });
    res.status(201).json(user);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı' });
  }
});

router.patch('/users/:id', requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      isActive: z.boolean().optional(),
      role: z.enum(['parent', 'admin']).optional(),
      subscriptionPlan: z.enum(['trial', 'daily', 'weekly', 'monthly', 'yearly', 'lifetime']).optional(),
      menuPin: z.string().min(4).max(8).optional(),
    });
    const data = schema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.menuPin !== undefined) updateData.menuPin = data.menuPin;
    if (data.subscriptionPlan !== undefined) {
      updateData.subscriptionPlan = data.subscriptionPlan;
      updateData.subscriptionExpiresAt = extendSubscription(data.subscriptionPlan);
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        menuPin: true,
      },
    });
    res.json(user);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Güncelleme başarısız' });
  }
});

router.get('/devices', requireAdmin, async (_req, res) => {
  const devices = await prisma.device.findMany({
    orderBy: { lastSeen: 'desc' },
    include: { user: { select: { email: true } } },
  });
  res.json(devices);
});

router.patch('/devices/:id', requireAdmin, async (req, res) => {
  try {
    const schema = z.object({
      isActive: z.boolean().optional(),
      deviceName: z.string().min(1).max(120).optional(),
    });
    const data = schema.parse(req.body);
    if (data.isActive === undefined && data.deviceName === undefined) {
      return res.status(400).json({ error: 'Güncellenecek alan gerekli' });
    }
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: {
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.deviceName !== undefined ? { deviceName: data.deviceName } : {}),
      },
      include: { user: { select: { email: true } } },
    });
    res.json(device);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Güncelleme başarısız' });
  }
});

export default router;
