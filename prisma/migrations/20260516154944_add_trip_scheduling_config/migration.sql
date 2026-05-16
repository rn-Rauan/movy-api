-- CreateTable
CREATE TABLE "trip_scheduling_config" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "daysAhead" INTEGER NOT NULL DEFAULT 14,
    "generationCron" TEXT NOT NULL DEFAULT '0 2 * * *',
    "autoCancelCron" TEXT NOT NULL DEFAULT '*/15 * * * *',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_scheduling_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trip_scheduling_config_organizationId_key" ON "trip_scheduling_config"("organizationId");

-- CreateIndex
CREATE INDEX "trip_scheduling_config_organizationId_idx" ON "trip_scheduling_config"("organizationId");

-- AddForeignKey
ALTER TABLE "trip_scheduling_config" ADD CONSTRAINT "trip_scheduling_config_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
