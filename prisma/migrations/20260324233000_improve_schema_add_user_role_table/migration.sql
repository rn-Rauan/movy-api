-- CreateTable user_role
CREATE TABLE "user_role" (
    "userId" TEXT NOT NULL,
    "roleId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- Add indexes to plan
CREATE UNIQUE INDEX "plan_name_key" ON "plan"("name");
CREATE INDEX "plan_isActive_idx" ON "plan"("isActive");

-- Add indexes to organization
CREATE INDEX "organization_slug_idx" ON "organization"("slug");
CREATE INDEX "organization_status_idx" ON "organization"("status");

-- Add indexes to user
CREATE INDEX "user_organizationId_idx" ON "user"("organizationId");
CREATE INDEX "user_status_idx" ON "user"("status");

-- Add indexes to driver
CREATE UNIQUE INDEX "driver_cnh_key" ON "driver"("cnh");

-- Add indexes to vehicle
CREATE INDEX "vehicle_organizationId_idx" ON "vehicle"("organizationId");
CREATE INDEX "vehicle_status_idx" ON "vehicle"("status");

-- Add indexes to trip_template
CREATE INDEX "trip_template_organizationId_idx" ON "trip_template"("organizationId");
CREATE INDEX "trip_template_status_idx" ON "trip_template"("status");
CREATE INDEX "trip_template_isPublic_idx" ON "trip_template"("isPublic");

-- Add indexes to trip_instance
CREATE INDEX "trip_instance_driverId_idx" ON "trip_instance"("driverId");
CREATE INDEX "trip_instance_vehicleId_idx" ON "trip_instance"("vehicleId");
CREATE INDEX "trip_instance_tripTemplateId_idx" ON "trip_instance"("tripTemplateId");
CREATE INDEX "trip_instance_tripStatus_idx" ON "trip_instance"("tripStatus");
CREATE INDEX "trip_instance_departureTime_idx" ON "trip_instance"("departureTime");

-- Add indexes to enrollment
CREATE INDEX "enrollment_userId_idx" ON "enrollment"("userId");
CREATE INDEX "enrollment_tripInstanceId_idx" ON "enrollment"("tripInstanceId");
CREATE INDEX "enrollment_organizationId_idx" ON "enrollment"("organizationId");
CREATE INDEX "enrollment_status_idx" ON "enrollment"("status");

-- Add indexes to payment
CREATE INDEX "payment_organizationId_idx" ON "payment"("organizationId");
CREATE INDEX "payment_status_idx" ON "payment"("status");

-- Add indexes to subscription
CREATE INDEX "subscriptions_organizationId_idx" ON "subscriptions"("organizationId");
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- Add indexes to audit_log
CREATE INDEX "audit_log_organizationId_idx" ON "audit_log"("organizationId");
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- Add foreign key for user_role
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add unique constraint to role name
ALTER TABLE "role" ADD CONSTRAINT "role_name_key" UNIQUE ("name");

-- Drop old implicit many-to-many table if it exists
DROP TABLE IF EXISTS "_RoleToUser" CASCADE;
