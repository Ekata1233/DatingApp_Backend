-- CreateEnum
CREATE TYPE "HostActivityAction" AS ENUM ('PAUSED', 'RESUMED', 'REMOVED');

-- CreateEnum
CREATE TYPE "HostRemovalReason" AS ENUM ('LEFT_THE_TEAM', 'SEASONAL_NOT_NEEDED', 'CONDUCT_ISSUE', 'OTHER');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_HOST_CHANGED';

-- AlterTable
ALTER TABLE "hosts" ADD COLUMN     "removalNote" TEXT,
ADD COLUMN     "removalReason" "HostRemovalReason",
ADD COLUMN     "resumedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "event_hosts" ADD COLUMN     "replacedByHostId" UUID,
ADD COLUMN     "replacementReason" "HostRemovalReason";

-- CreateTable
CREATE TABLE "host_activity_logs" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "performedById" UUID NOT NULL,
    "action" "HostActivityAction" NOT NULL,
    "previousStatus" "HostStatus",
    "newStatus" "HostStatus" NOT NULL,
    "removalReason" "HostRemovalReason",
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "host_activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "host_activity_logs_hostId_createdAt_idx" ON "host_activity_logs"("hostId", "createdAt");

-- CreateIndex
CREATE INDEX "host_activity_logs_businessId_createdAt_idx" ON "host_activity_logs"("businessId", "createdAt");

-- CreateIndex
CREATE INDEX "host_activity_logs_performedById_idx" ON "host_activity_logs"("performedById");

-- CreateIndex
CREATE INDEX "event_hosts_replacedByHostId_idx" ON "event_hosts"("replacedByHostId");

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_replacedByHostId_fkey" FOREIGN KEY ("replacedByHostId") REFERENCES "hosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_activity_logs" ADD CONSTRAINT "host_activity_logs_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_activity_logs" ADD CONSTRAINT "host_activity_logs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "host_activity_logs" ADD CONSTRAINT "host_activity_logs_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "event_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

