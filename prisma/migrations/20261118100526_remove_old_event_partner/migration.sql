/*
  Warnings:

  - You are about to drop the column `eventPartnerId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the `event_partners` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_eventPartnerId_fkey";

-- DropIndex
DROP INDEX "Event_eventPartnerId_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "eventPartnerId";

-- DropTable
DROP TABLE "event_partners";

-- DropEnum
DROP TYPE "BusinessType";

-- DropEnum
DROP TYPE "PartnerStatus";
