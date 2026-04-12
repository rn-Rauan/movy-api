/*
  Warnings:

  - The primary key for the `driver` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[userId]` on the table `driver` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cnhExpiresAt` to the `driver` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `driver` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `organizationId` to the `driver` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- DropIndex
DROP INDEX "trip_instance_driverId_idx";

-- DropIndex
DROP INDEX "trip_instance_tripTemplateId_idx";

-- DropIndex
DROP INDEX "trip_instance_vehicleId_idx";

-- AlterTable
ALTER TABLE "driver" DROP CONSTRAINT "driver_pkey" CASCADE;
ALTER TABLE "driver"
ADD COLUMN     "cnhExpiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "driverStatus" "DriverStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD CONSTRAINT "driver_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_userId_key" ON "driver"("userId");

-- CreateIndex
CREATE INDEX "driver_organizationId_idx" ON "driver"("organizationId");

-- CreateIndex
CREATE INDEX "trip_instance_driverId_organizationId_idx" ON "trip_instance"("driverId", "organizationId");

-- CreateIndex
CREATE INDEX "trip_instance_vehicleId_organizationId_idx" ON "trip_instance"("vehicleId", "organizationId");

-- CreateIndex
CREATE INDEX "trip_instance_tripTemplateId_organizationId_idx" ON "trip_instance"("tripTemplateId", "organizationId");

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_driverId_fkey" 
FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

