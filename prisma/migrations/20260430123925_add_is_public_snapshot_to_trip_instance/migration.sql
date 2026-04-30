-- AlterTable
ALTER TABLE "trip_instance" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "trip_instance_isPublic_idx" ON "trip_instance"("isPublic");
