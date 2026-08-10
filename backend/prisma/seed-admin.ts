import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  const name = process.env.ADMIN_SEED_NAME ?? 'Admin';

  if (!email || !password) {
    throw new Error('ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set in .env');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, name },
    create: { email, passwordHash, name },
  });

  console.log(`admin ready: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
