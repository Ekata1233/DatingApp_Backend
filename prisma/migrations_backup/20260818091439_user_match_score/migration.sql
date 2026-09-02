/*
  Warnings:

  - You are about to drop the column `eventPartner` on the `Event` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "eventPartner",
ADD COLUMN     "eventPartnerId" TEXT;

-- CreateIndex
CREATE INDEX "Event_eventPartnerId_idx" ON "Event"("eventPartnerId");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventPartnerId_fkey" FOREIGN KEY ("eventPartnerId") REFERENCES "event_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
