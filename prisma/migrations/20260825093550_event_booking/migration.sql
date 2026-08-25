ALTER TABLE "EventBooking"
DROP CONSTRAINT IF EXISTS "EventBooking_paymentId_fkey";

ALTER TABLE "EventBooking"
ALTER COLUMN "paymentId" TYPE UUID
USING NULLIF("paymentId", '')::UUID;

ALTER TABLE "EventBooking"
ADD CONSTRAINT "EventBooking_paymentId_fkey"
FOREIGN KEY ("paymentId")
REFERENCES "Payment"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;