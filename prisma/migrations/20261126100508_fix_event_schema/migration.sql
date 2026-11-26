/*
  Warnings:

  - Added the required column `eventDateId` to the `EventBooking` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EventReactiveStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'PAUSED', 'EXPIRED', 'CANCELLED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "EventDateStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventStatus" ADD VALUE 'PAUSED';
ALTER TYPE "EventStatus" ADD VALUE 'EXPIRED';

-- AlterEnum
ALTER TYPE "EventTicketType" ADD VALUE 'COUPLE';

-- DropIndex
DROP INDEX "EventBooking_bookingNumber_idx";

-- AlterTable
ALTER TABLE "EventBooking" ADD COLUMN     "eventDateId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "business_details" ADD COLUMN     "hostingSince" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "event_dates" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "reactivationId" UUID;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "eventReactiveStatus" "EventReactiveStatus",
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "pauseReason" TEXT,
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ADD COLUMN     "reactivatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "trip_details" ALTER COLUMN "vehicle" DROP NOT NULL;

-- CreateTable
CREATE TABLE "event_reactivations" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "status" "EventReactiveStatus" NOT NULL DEFAULT 'DRAFT',
    "previousEventStatus" "EventStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "publishedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "pauseReason" TEXT,
    "expiredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reactivations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reactivation_dates" (
    "id" UUID NOT NULL,
    "reactivationId" UUID NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3) NOT NULL,
    "gateOpensAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isMoreDate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reactivation_dates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_reactivations_eventId_status_idx" ON "event_reactivations"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_reactivations_status_createdAt_idx" ON "event_reactivations"("status", "createdAt");

-- CreateIndex
CREATE INDEX "event_reactivations_eventId_createdAt_idx" ON "event_reactivations"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "event_reactivation_dates_reactivationId_idx" ON "event_reactivation_dates"("reactivationId");

-- CreateIndex
CREATE UNIQUE INDEX "event_reactivation_dates_reactivationId_startDateTime_key" ON "event_reactivation_dates"("reactivationId", "startDateTime");

-- CreateIndex
CREATE INDEX "EventBooking_eventDateId_status_idx" ON "EventBooking"("eventDateId", "status");

-- CreateIndex
CREATE INDEX "event_dates_status_endDateTime_idx" ON "event_dates"("status", "endDateTime");

-- CreateIndex
CREATE INDEX "event_dates_reactivationId_status_idx" ON "event_dates"("reactivationId", "status");

-- CreateIndex
CREATE INDEX "events_eventReactiveStatus_idx" ON "events"("eventReactiveStatus");

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_reactivationId_fkey" FOREIGN KEY ("reactivationId") REFERENCES "event_reactivations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reactivations" ADD CONSTRAINT "event_reactivations_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reactivation_dates" ADD CONSTRAINT "event_reactivation_dates_reactivationId_fkey" FOREIGN KEY ("reactivationId") REFERENCES "event_reactivations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
