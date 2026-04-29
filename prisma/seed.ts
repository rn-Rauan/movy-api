import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { PlanName, RoleName } from 'generated/prisma/enums';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const rolesToSeed = [
  { id: 1, name: RoleName.ADMIN },
  { id: 2, name: RoleName.DRIVER },
];

const plansToSeed = [
  {
    name: PlanName.FREE,
    price: 0.0,
    maxVehicles: 1,
    maxDrivers: 1,
    maxMonthlyTrips: 5,
    durationDays: 30,
    isActive: true,
  },
  {
    name: PlanName.BASIC,
    price: 79.9,
    maxVehicles: 3,
    maxDrivers: 5,
    maxMonthlyTrips: 60,
    durationDays: 30,
    isActive: true,
  },
  {
    name: PlanName.PRO,
    price: 149.9,
    maxVehicles: 10,
    maxDrivers: 15,
    maxMonthlyTrips: 200,
    durationDays: 30,
    isActive: true,
  },
  {
    name: PlanName.PREMIUM,
    price: 399.9,
    maxVehicles: 30,
    maxDrivers: 30,
    maxMonthlyTrips: 9999,
    durationDays: 30,
    isActive: true,
  },
];

async function main() {
  console.log('Seeding roles...');
  for (const roleData of rolesToSeed) {
    const role = await prisma.role.upsert({
      where: { id: roleData.id },
      update: {},
      create: { id: roleData.id, name: roleData.name },
    });
    console.log(`Seeded role: ${role.name} (id: ${role.id})`);
  }

  console.log('Seeding plans...');
  for (const planData of plansToSeed) {
    const plan = await prisma.plan.upsert({
      where: { name: planData.name },
      update: {
        price: planData.price,
        maxVehicles: planData.maxVehicles,
        maxDrivers: planData.maxDrivers,
        maxMonthlyTrips: planData.maxMonthlyTrips,
        durationDays: planData.durationDays,
        isActive: planData.isActive,
      },
      create: planData,
    });
    console.log(
      `Seeded plan: ${plan.name} (vehicles: ${plan.maxVehicles}, drivers: ${plan.maxDrivers}, trips/mo: ${plan.maxMonthlyTrips})`,
    );
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