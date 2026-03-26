/*
  Warnings:

  - The values [PASSENGER] on the enum `RoleName` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `action` on the `audit_log` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `cnh` on the `driver` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `cnhCategory` on the `driver` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(5)`.
  - You are about to alter the column `boardingPoint` on the `enrollment` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `name` on the `organization` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `telephone` on the `organization` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - You are about to alter the column `slug` on the `organization` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `departurePoint` on the `trip_template` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `destination` on the `trip_template` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `organizationId` on the `user` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `email` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `telephone` on the `user` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(20)`.
  - The primary key for the `user_role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `plate` on the `vehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(10)`.
  - You are about to alter the column `model` on the `vehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `type` on the `vehicle` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to drop the `_UserRoles` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `user_role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RoleName_new" AS ENUM ('ADMIN', 'DRIVER');
ALTER TABLE "role" ALTER COLUMN "name" TYPE "RoleName_new" USING ("name"::text::"RoleName_new");
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "public"."RoleName_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "_UserRoles" DROP CONSTRAINT "_UserRoles_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserRoles" DROP CONSTRAINT "_UserRoles_B_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "audit_log" DROP CONSTRAINT "audit_log_userId_fkey";

-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_userId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_tripInstanceId_fkey";

-- DropForeignKey
ALTER TABLE "enrollment" DROP CONSTRAINT "enrollment_userId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_enrollmentId_fkey";

-- DropForeignKey
ALTER TABLE "payment" DROP CONSTRAINT "payment_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_driverId_fkey";

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_tripTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "trip_instance" DROP CONSTRAINT "trip_instance_vehicleId_fkey";

-- DropForeignKey
ALTER TABLE "trip_template" DROP CONSTRAINT "trip_template_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "user" DROP CONSTRAINT "user_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "vehicle" DROP CONSTRAINT "vehicle_organizationId_fkey";

-- DropIndex
DROP INDEX "user_organizationId_idx";

-- AlterTable
ALTER TABLE "audit_log" ALTER COLUMN "action" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "driver" ALTER COLUMN "cnh" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "cnhCategory" SET DATA TYPE VARCHAR(5);

-- AlterTable
ALTER TABLE "enrollment" ALTER COLUMN "boardingPoint" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "organization" ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "telephone" SET DATA TYPE VARCHAR(20),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "trip_template" ALTER COLUMN "departurePoint" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "destination" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "user" DROP COLUMN "organizationId",
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "telephone" SET DATA TYPE VARCHAR(20);

-- AlterTable
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey",
ADD COLUMN     "organizationId" TEXT NOT NULL,
ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("userId", "roleId", "organizationId");

-- AlterTable
ALTER TABLE "vehicle" ALTER COLUMN "plate" SET DATA TYPE VARCHAR(10),
ALTER COLUMN "model" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "type" SET DATA TYPE VARCHAR(100);

-- DropTable
DROP TABLE "_UserRoles";

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "driver" ADD CONSTRAINT "driver_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_template" ADD CONSTRAINT "trip_template_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "driver"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_tripTemplateId_fkey" FOREIGN KEY ("tripTemplateId") REFERENCES "trip_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_tripInstanceId_fkey" FOREIGN KEY ("tripInstanceId") REFERENCES "trip_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollment" ADD CONSTRAINT "enrollment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
