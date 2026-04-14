/*
  Warnings:

  - Changed the type of `type` on the `vehicle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('VAN', 'BUS', 'MINIBUS', 'CAR');

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_driverId_fkey";

-- AlterTable
ALTER TABLE "audit_log" ADD COLUMN     "details" JSONB;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "type",
ADD COLUMN     "type" "VehicleType" NOT NULL;

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE CASCADE ON UPDATE CASCADE;
