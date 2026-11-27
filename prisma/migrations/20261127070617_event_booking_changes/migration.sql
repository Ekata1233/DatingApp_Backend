/*
  Warnings:

  - A unique constraint covering the columns `[idempotencyKey]` on the table `EventBooking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qrTokenHash]` on the table `EventBookingTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EventWaitlistStatus" AS ENUM ('WAITING', 'OFFERED', 'CONVERTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventBookingPaymentStatus" AS ENUM ('UNPAID', 'PROCESSING', 'PARTIALLY_PAID', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "EventBookingRefundStatus" AS ENUM ('NOT_REQUESTED', 'REQUESTED', 'PROCESSING', 'PARTIALLY_REFUNDED', 'REFUNDED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "EventBookingSource" AS ENUM ('MOBILE_APP', 'WEBSITE', 'ORGANIZER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EventBookingActorType" AS ENUM ('USER', 'ORGANIZER', 'HOST', 'ADMIN', 'SYSTEM', 'PAYMENT_GATEWAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventBookingStatus" ADD VALUE 'PARTIALLY_CANCELLED';
ALTER TYPE "EventBookingStatus" ADD VALUE 'COMPLETED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventTicketStatus" ADD VALUE 'CHECKED_IN';
ALTER TYPE "EventTicketStatus" ADD VALUE 'CHECKED_OUT';
ALTER TYPE "EventTicketStatus" ADD VALUE 'NO_SHOW';
ALTER TYPE "EventTicketStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "EventBookingTicket" DROP CONSTRAINT "EventBookingTicket_bookingId_fkey";

-- AlterTable
ALTER TABLE "EventBooking" ADD COLUMN     "bookingSource" "EventBookingSource" NOT NULL DEFAULT 'MOBILE_APP',
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "eventSnapshot" JSONB,
ADD COLUMN     "expiredAt" TIMESTAMP(3),
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "idempotencyKey" TEXT,
ADD COLUMN     "paymentStatus" "EventBookingPaymentStatus" NOT NULL DEFAULT 'UNPAID',
ADD COLUMN     "policySnapshot" JSONB,
ADD COLUMN     "pricingSnapshot" JSONB,
ADD COLUMN     "refundStatus" "EventBookingRefundStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "EventBookingTicket" ADD COLUMN     "basePrice" DECIMAL(10,2),
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledById" UUID,
ADD COLUMN     "cancelledByType" "EventBookingActorType",
ADD COLUMN     "checkedInAt" TIMESTAMP(3),
ADD COLUMN     "checkedOutAt" TIMESTAMP(3),
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "guestCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "issuedAt" TIMESTAMP(3),
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "qrTokenHash" TEXT,
ADD COLUMN     "refundedAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalAmount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "event_dates" ADD COLUMN     "bookingClosesAt" TIMESTAMP(3),
ADD COLUMN     "bookingOpensAt" TIMESTAMP(3),
ADD COLUMN     "isBookingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "totalGuestCapacity" INTEGER;

-- AlterTable
ALTER TABLE "event_reactivations" ADD COLUMN     "cancellationReason" TEXT;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "event_booking_histories" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "EventBookingStatus",
    "newStatus" "EventBookingStatus",
    "actorType" "EventBookingActorType" NOT NULL,
    "actorId" UUID,
    "reason" TEXT,
    "description" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_booking_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_ticket_inventories" (
    "id" UUID NOT NULL,
    "eventDateId" UUID NOT NULL,
    "ticketType" "EventTicketType" NOT NULL,
    "totalCapacity" INTEGER NOT NULL,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "bookedQuantity" INTEGER NOT NULL DEFAULT 0,
    "guestsPerTicket" INTEGER NOT NULL DEFAULT 1,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "discountPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "sellingPrice" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_ticket_inventories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_booking_guests" (
    "id" UUID NOT NULL,
    "bookingTicketId" UUID NOT NULL,
    "userId" UUID,
    "fullName" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "age" INTEGER,
    "gender" TEXT,
    "isPrimaryGuest" BOOLEAN NOT NULL DEFAULT false,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "checkedInAt" TIMESTAMP(3),
    "checkedOutAt" TIMESTAMP(3),
    "isNoShow" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_booking_guests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_waitlists" (
    "id" UUID NOT NULL,
    "eventDateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "ticketType" "EventTicketType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "EventWaitlistStatus" NOT NULL DEFAULT 'WAITING',
    "offeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_booking_histories_bookingId_createdAt_idx" ON "event_booking_histories"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "event_booking_histories_actorType_actorId_idx" ON "event_booking_histories"("actorType", "actorId");

-- CreateIndex
CREATE INDEX "event_ticket_inventories_eventDateId_isActive_idx" ON "event_ticket_inventories"("eventDateId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "event_ticket_inventories_eventDateId_ticketType_key" ON "event_ticket_inventories"("eventDateId", "ticketType");

-- CreateIndex
CREATE INDEX "event_booking_guests_bookingTicketId_idx" ON "event_booking_guests"("bookingTicketId");

-- CreateIndex
CREATE INDEX "event_booking_guests_userId_idx" ON "event_booking_guests"("userId");

-- CreateIndex
CREATE INDEX "event_waitlists_eventDateId_ticketType_status_createdAt_idx" ON "event_waitlists"("eventDateId", "ticketType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "event_waitlists_userId_status_idx" ON "event_waitlists"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_idempotencyKey_key" ON "EventBooking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EventBooking_userId_status_createdAt_idx" ON "EventBooking"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EventBooking_eventDateId_paymentStatus_idx" ON "EventBooking"("eventDateId", "paymentStatus");

-- CreateIndex
CREATE INDEX "EventBooking_status_expiresAt_idx" ON "EventBooking"("status", "expiresAt");

-- CreateIndex
CREATE INDEX "EventBooking_createdAt_idx" ON "EventBooking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventBookingTicket_qrTokenHash_key" ON "EventBookingTicket"("qrTokenHash");

-- AddForeignKey
ALTER TABLE "EventBookingTicket" ADD CONSTRAINT "EventBookingTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "EventBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_booking_histories" ADD CONSTRAINT "event_booking_histories_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "EventBooking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_ticket_inventories" ADD CONSTRAINT "event_ticket_inventories_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_booking_guests" ADD CONSTRAINT "event_booking_guests_bookingTicketId_fkey" FOREIGN KEY ("bookingTicketId") REFERENCES "EventBookingTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_booking_guests" ADD CONSTRAINT "event_booking_guests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_waitlists" ADD CONSTRAINT "event_waitlists_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_waitlists" ADD CONSTRAINT "event_waitlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
