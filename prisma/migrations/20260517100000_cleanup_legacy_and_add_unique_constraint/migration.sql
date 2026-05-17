-- Cleanup of legacy rows that pre-date the Trip Scheduling work.
-- Trip instances created before the unique constraint may collide on
-- (tripTemplateId, departureTime). Older templates may also be missing
-- the new required fields (defaultCapacity, departureTimeOfDay,
-- arrivalTimeOfDay). All such rows are deleted; the unique constraint is
-- then enforced at the DB level so the recurring-generation cron is
-- protected against multi-replica races.

-- 1. Drop legacy templates that lack any of the required scheduling fields.
--    Cascade removes their orphaned trip_instances (FK onDelete: Cascade),
--    which in turn cascades enrollments and payments.
DELETE FROM "trip_template"
WHERE "departureTimeOfDay" IS NULL
   OR "arrivalTimeOfDay" IS NULL
   OR "defaultCapacity" IS NULL;

-- 2. Drop any leftover duplicate trip_instances for the same template
--    on the same exact departureTime (would block the unique constraint).
--    Keeps the oldest row per (tripTemplateId, departureTime) pair.
DELETE FROM "trip_instance" t1
USING "trip_instance" t2
WHERE t1."tripTemplateId" = t2."tripTemplateId"
  AND t1."departureTime"  = t2."departureTime"
  AND t1."createdAt"      > t2."createdAt";

-- 3. The composite (tripTemplateId, departureTime) index from the prior
--    schema is now redundant with the new unique constraint. Drop it
--    before adding the unique index so Postgres doesn't keep two copies.
DROP INDEX IF EXISTS "trip_instance_tripTemplateId_departureTime_idx";

-- 4. Add the unique constraint that future inserts must satisfy.
CREATE UNIQUE INDEX "trip_instance_tripTemplateId_departureTime_key"
  ON "trip_instance"("tripTemplateId", "departureTime");
