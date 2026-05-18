-- AlterTable
ALTER TABLE "trip_template" ADD COLUMN     "defaultDriverId" TEXT,
ADD COLUMN     "defaultVehicleId" TEXT;

-- CreateIndex
CREATE INDEX "trip_template_defaultDriverId_idx" ON "trip_template"("defaultDriverId");

-- CreateIndex
CREATE INDEX "trip_template_defaultVehicleId_idx" ON "trip_template"("defaultVehicleId");

-- AddForeignKey
ALTER TABLE "trip_template" ADD CONSTRAINT "trip_template_defaultDriverId_fkey" FOREIGN KEY ("defaultDriverId") REFERENCES "driver"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_template" ADD CONSTRAINT "trip_template_defaultVehicleId_fkey" FOREIGN KEY ("defaultVehicleId") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
