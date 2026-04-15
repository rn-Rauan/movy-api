/*
  Warnings:

  - You are about to drop the column `organizationId` on the `driver` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "driver" DROP CONSTRAINT "driver_organizationId_fkey";

-- DropIndex
DROP INDEX "driver_organizationId_idx";

-- AlterTable
ALTER TABLE "driver" DROP COLUMN "organizationId";
