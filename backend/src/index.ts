import 'dotenv/config';

console.log('Backend başlatılıyor...', {
  port: process.env.PORT,
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
});

process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));

import express from 'express';
import cors from 'cors';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/device';
import dataRoutes from './routes/data';
import adminRoutes from './routes/admin';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

const execAsync = promisify(exec);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || 'http://localhost:3000').trim().replace(/\/$/, '');

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/config', (_req, res) => {
  const apiBaseUrl = process.env.PUBLIC_API_URL || `http://localhost:${PORT}`;
  res.json({ apiBaseUrl: apiBaseUrl.replace(/\/$/, ''), version: 1 });
});

app.use('/auth', authRoutes);
app.use('/device', deviceRoutes);
app.use('/data', dataRoutes);
app.use('/admin', adminRoutes);

async function ensureAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@takip.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: 'admin' },
    });
    console.log(`Admin hesabı oluşturuldu: ${adminEmail}`);
  }
}

async function initDatabase() {
  try {
    console.log('Veritabanı senkronize ediliyor...');
    await execAsync('npx prisma db push --accept-data-loss');
    await ensureAdmin();
    console.log('Veritabanı hazır');
  } catch (e) {
    console.error('Veritabanı hatası:', e);
  }
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend çalışıyor: 0.0.0.0:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  initDatabase().catch(console.error);
});

server.on('error', (err) => {
  console.error('Sunucu başlatılamadı:', err);
  process.exit(1);
});
