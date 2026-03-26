/*
  Warnings:

  - You are about to drop the column `boardingPoint` on the `enrollment` table. All the data in the column will be lost.
  - Added the required column `alightingStop` to the `enrollment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `boardingStop` to the `enrollment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "enrollment" DROP COLUMN "boardingPoint",
ADD COLUMN     "alightingStop" VARCHAR(255) NOT NULL,
ADD COLUMN     "boardingStop" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "trip_template" ADD COLUMN     "stops" TEXT[];
