import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Refusing admin provisioning without BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin');
  }

  const email = process.env.PROVISION_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.PROVISION_ADMIN_PASSWORD;
  const name = process.env.PROVISION_ADMIN_NAME?.trim() || 'Initial Administrator';
  if (!email || !password || password.length < 12) {
    throw new Error('PROVISION_ADMIN_EMAIL and a password of at least 12 characters are required');
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error(`Refusing to overwrite existing account ${email}`);
  }

  const business = await prisma.business.upsert({
    where: { email },
    update: {},
    create: {
      name: process.env.PROVISION_COMPANY_NAME?.trim() || 'Initial Company',
      email,
      timezone: 'UTC',
    },
  });
  await prisma.user.create({
    data: {
      email,
      password: await bcrypt.hash(password, 12),
      name,
      role: UserRole.ADMIN,
      businessId: business.id,
    },
  });
  console.log(`Provisioned initial administrator ${email}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
