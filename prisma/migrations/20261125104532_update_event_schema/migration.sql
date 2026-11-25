-- AlterTable
ALTER TABLE "event_experiences" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "time" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "trip_stops" ADD COLUMN     "location" TEXT;

-- CreateIndex
CREATE INDEX "events_businessDetailsId_deletedAt_status_idx" ON "events"("businessDetailsId", "deletedAt", "status");

-- CreateIndex
CREATE INDEX "partner_event_categories_eventDurationType_isActive_sortOrd_idx" ON "partner_event_categories"("eventDurationType", "isActive", "sortOrder");
