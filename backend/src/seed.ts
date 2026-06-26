import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma';

async function seed() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@takip.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: { email: adminEmail, passwordHash, role: 'admin' },
    });
    console.log(`Admin oluşturuldu: ${adminEmail}`);
  } else {
    console.log('Admin zaten mevcut');
  }
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
