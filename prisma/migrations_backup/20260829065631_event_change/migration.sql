/*
  Warnings:

  - The values [EVERYONE] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `capacity` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `entryPrice` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `genderMix` on the `Event` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roseId]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[complimentId]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[giftId]` on the table `ChatMessage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MEN', 'WOMEN', 'NON_BINARY', 'TRANS_MAN', 'TRANS_WOMAN', 'OTHER', 'PREFER_NOT_TO_SAY');
ALTER TABLE "users" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TABLE "user_profiles" ALTER COLUMN "interested_in" TYPE "Gender_new" USING ("interested_in"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- AlterTable
ALTER TABLE "ChatMessage" ADD COLUMN     "complimentId" UUID,
ADD COLUMN     "giftId" UUID,
ADD COLUMN     "roseId" UUID;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "capacity",
DROP COLUMN "entryPrice",
DROP COLUMN "genderMix",
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "menCapacity" INTEGER,
ADD COLUMN     "menDiscountedPrice" DECIMAL(10,2),
ADD COLUMN     "menEntryPrice" DECIMAL(10,2),
ADD COLUMN     "otherCapacity" INTEGER,
ADD COLUMN     "otherDiscountedPrice" DECIMAL(10,2),
ADD COLUMN     "otherEntryPrice" DECIMAL(10,2),
ADD COLUMN     "totalCapacity" INTEGER,
ADD COLUMN     "womenCapacity" INTEGER,
ADD COLUMN     "womenDiscountedPrice" DECIMAL(10,2),
ADD COLUMN     "womenEntryPrice" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "EventItinerary" ADD COLUMN     "accommodation" TEXT,
ADD COLUMN     "date" TEXT,
ADD COLUMN     "dayNumber" INTEGER,
ADD COLUMN     "distance" TEXT,
ADD COLUMN     "elevation" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "meals" TEXT;

-- CreateTable
CREATE TABLE "EventFAQ" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeatureTag" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFeatureTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventFAQ_eventId_idx" ON "EventFAQ"("eventId");

-- CreateIndex
CREATE INDEX "EventFeatureTag_eventId_idx" ON "EventFeatureTag"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_roseId_key" ON "ChatMessage"("roseId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_complimentId_key" ON "ChatMessage"("complimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_giftId_key" ON "ChatMessage"("giftId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roseId_fkey" FOREIGN KEY ("roseId") REFERENCES "UserRose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_complimentId_fkey" FOREIGN KEY ("complimentId") REFERENCES "UserCompliment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "UserGift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFAQ" ADD CONSTRAINT "EventFAQ_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeatureTag" ADD CONSTRAINT "EventFeatureTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
