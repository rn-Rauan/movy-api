-- Replace single-value cnhCategory column with cnhCategories text[]
-- preserving the existing single category as a 1-element array.

ALTER TABLE "driver" ADD COLUMN "cnhCategories" TEXT[] NOT NULL DEFAULT '{}';

UPDATE "driver" SET "cnhCategories" = ARRAY["cnhCategory"];

ALTER TABLE "driver" DROP COLUMN "cnhCategory";

ALTER TABLE "driver" ALTER COLUMN "cnhCategories" DROP DEFAULT;
