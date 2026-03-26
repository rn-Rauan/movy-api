/*
  Warnings:

  - Added the required column `organizationId` to the `trip_instance` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "trip_instance" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "trip_instance_organizationId_idx" ON "trip_instance"("organizationId");

-- AddForeignKey
ALTER TABLE "trip_instance" ADD CONSTRAINT "trip_instance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
