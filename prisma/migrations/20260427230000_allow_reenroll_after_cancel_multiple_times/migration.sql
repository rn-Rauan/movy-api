-- DropIndex
DROP INDEX IF EXISTS "enrollment_userId_tripInstanceId_key";
DROP INDEX IF EXISTS "enrollment_userId_tripInstanceId_status_key";

-- AlterTable
ALTER TABLE "enrollment" ADD COLUMN IF NOT EXISTS "activeKey" TEXT;

-- Backfill
UPDATE "enrollment"
SET "activeKey" = "userId" || ':' || "tripInstanceId"
WHERE "status" = 'ACTIVE' AND "activeKey" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "enrollment_activeKey_key" ON "enrollment"("activeKey");
