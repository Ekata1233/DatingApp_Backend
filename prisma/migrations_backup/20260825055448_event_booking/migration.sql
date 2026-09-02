-- CreateEnum
CREATE TYPE "EventBookingStatus" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'ATTENDED', 'EXPIRED');

-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'EVENT_BOOKING';

-- CreateTable
CREATE TABLE "EventBooking" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "bookingNumber" VARCHAR(50) NOT NULL,
    "ticketType" VARCHAR(100),
    "ticketCount" INTEGER NOT NULL DEFAULT 1,
    "ticketAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "couponCode" VARCHAR(50),
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "EventBookingStatus" NOT NULL DEFAULT 'PENDING',
    "ticketId" VARCHAR(50) NOT NULL,
    "qrCodeUrl" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_bookingNumber_key" ON "EventBooking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_ticketId_key" ON "EventBooking"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_paymentId_key" ON "EventBooking"("paymentId");

-- CreateIndex
CREATE INDEX "EventBooking_userId_idx" ON "EventBooking"("userId");

-- CreateIndex
CREATE INDEX "EventBooking_eventId_idx" ON "EventBooking"("eventId");

-- CreateIndex
CREATE INDEX "EventBooking_status_idx" ON "EventBooking"("status");

-- CreateIndex
CREATE INDEX "EventBooking_bookingNumber_idx" ON "EventBooking"("bookingNumber");

-- CreateIndex
CREATE INDEX "EventBooking_ticketId_idx" ON "EventBooking"("ticketId");

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;
