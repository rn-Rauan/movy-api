-- AlterTable
ALTER TABLE "enrollment" ALTER COLUMN "enrollmentDate" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "trip_template" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;
