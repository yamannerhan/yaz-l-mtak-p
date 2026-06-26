import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/device';
import dataRoutes from './routes/data';
import adminRoutes from './routes/admin';
import { prisma } from './lib/prisma';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, async () => {
  try {
    await ensureAdmin();
    console.log(`Backend çalışıyor: http://localhost:${PORT}`);
  } catch (e) {
    console.error('Başlatma hatası:', e);
  }
});
