-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "activeKey" TEXT;

-- Backfill
UPDATE "subscriptions"
SET "activeKey" = "organizationId"
WHERE "status" = 'ACTIVE' AND "activeKey" IS NULL;

UPDATE "subscriptions"
SET "activeKey" = NULL
WHERE "status" <> 'ACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_activeKey_key" ON "subscriptions"("activeKey");
