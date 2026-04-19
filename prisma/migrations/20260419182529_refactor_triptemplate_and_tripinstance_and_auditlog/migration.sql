/*
  Warnings:

  - You are about to drop the column `routeType` on the `enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `statusForRecurringTrip` on the `trip_instance` table. All the data in the column will be lost.
  - You are about to drop the column `routeType` on the `trip_template` table. All the data in the column will be lost.
  - Added the required column `EnrollmentType` to the `enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EnrollmentType" AS ENUM ('ONE_WAY', 'RETURN', 'ROUND_TRIP');

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_userId_fkey";

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_driverId_fkey";

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_vehicleId_fkey";

-- AlterTable
ALTER TABLE "enrollment" DROP COLUMN "routeType",
ADD COLUMN     "EnrollmentType" "EnrollmentType" NOT NULL;

-- AlterTable
ALTER TABLE "trip_instance" DROP COLUMN "statusForRecurringTrip",
ADD COLUMN     "autoCancelAt" TIMESTAMP(3),
ADD COLUMN     "forceConfirm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "minRevenue" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "trip_template" DROP COLUMN "routeType",
ADD COLUMN     "autoCancelEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoCancelOffset" INTEGER,
ADD COLUMN     "minRevenue" DECIMAL(10,2),
ALTER COLUMN "isRecurring" SET DEFAULT false;

-- DropEnum
DROP TYPE "RouteType";

-- CreateIndex
CREATE INDEX "subscriptions_expiresAt_idx" ON "subscriptions"("expiresAt");

-- CreateIndex
CREATE INDEX "trip_instance_tripTemplateId_departureTime_idx" ON "trip_instance"("tripTemplateId", "departureTime");

-- CreateIndex
CREATE INDEX "trip_instance_autoCancelAt_idx" ON "trip_instance"("autoCancelAt");

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
