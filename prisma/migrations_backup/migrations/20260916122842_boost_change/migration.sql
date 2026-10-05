/*
  Warnings:

  - Changed the type of `event_type` on the `boost_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "boost_events" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "source" TEXT,
DROP COLUMN "event_type",
ADD COLUMN     "event_type" "BoostEventType" NOT NULL;

-- CreateIndex
CREATE INDEX "boost_events_boost_usage_id_event_type_idx" ON "boost_events"("boost_usage_id", "event_type");

-- CreateIndex
CREATE INDEX "boost_events_boost_usage_id_actor_id_idx" ON "boost_events"("boost_usage_id", "actor_id");

-- CreateIndex
CREATE INDEX "boost_events_boost_usage_id_event_type_created_at_idx" ON "boost_events"("boost_usage_id", "event_type", "created_at");
