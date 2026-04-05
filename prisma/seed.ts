import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { RoleName } from 'generated/prisma/enums';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rolesToSeed = [
  {
    id: 1,
    name: RoleName.ADMIN,
  },
  {
    id: 2,
    name: RoleName.DRIVER,
  },
];

async function main() {
  console.log('Seeding roles...');

  for (const roleData of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { id: roleData.id },
      update: {},
      create: {
        id: roleData.id,
        name: roleData.name,
      },
    });
    console.log(`Seeded role: ${role.name} (id: ${role.id})`);
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error('Error seeding data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });