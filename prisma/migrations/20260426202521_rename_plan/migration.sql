/*
  Warnings:

  - The values [STANDARD] on the enum `PlanName` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `EnrollmentType` on the `enrollment` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,tripInstanceId]` on the table `enrollment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `enrollmentType` to the `enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "PlanName_new" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');
ALTER TABLE "public"."plan" ALTER COLUMN "name" DROP DEFAULT;
ALTER TABLE "plan" ALTER COLUMN "name" TYPE "PlanName_new" USING ("name"::text::"PlanName_new");
ALTER TYPE "PlanName" RENAME TO "PlanName_old";
ALTER TYPE "PlanName_new" RENAME TO "PlanName";
DROP TYPE "public"."PlanName_old";
ALTER TABLE "plan" ALTER COLUMN "name" SET DEFAULT 'FREE';
COMMIT;

-- AlterTable
ALTER TABLE "enrollment" DROP COLUMN "EnrollmentType",
ADD COLUMN     "enrollmentType" "EnrollmentType" NOT NULL;

-- CreateIndex
CREATE INDEX "enrollment_userId_tripInstanceId_status_idx" ON "enrollment"("userId", "tripInstanceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "enrollment_userId_tripInstanceId_key" ON "enrollment"("userId", "tripInstanceId");
