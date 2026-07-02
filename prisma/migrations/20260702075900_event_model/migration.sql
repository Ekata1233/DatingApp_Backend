/*
  Warnings:

  - The `highestEdu` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'LIVE', 'SOLD_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('SIGNATURE_MIXER', 'SPEED_DATING', 'WINE_TASTING', 'SUPPER_CLUB', 'BRUNCH_SOCIAL', 'ROOFTOP_MIXER');

-- CreateEnum
CREATE TYPE "GenderMix" AS ENUM ('FIFTY_FIFTY', 'WOMEN_LED', 'MEN_LED', 'OPEN');

-- CreateEnum
CREATE TYPE "EventIntent" AS ENUM ('MIXED', 'SERIOUS', 'CASUAL');

-- CreateEnum
CREATE TYPE "DressCode" AS ENUM ('CASUAL', 'SMART_CASUAL', 'SEMI_FORMAL', 'FORMAL', 'COCKTAIL', 'TRADITIONAL');

-- AlterTable
ALTER TABLE "user_edu_work" DROP COLUMN "highestEdu",
ADD COLUMN     "highestEdu" VARCHAR(100);

-- DropEnum
DROP TYPE "HighestEducation";

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "eventType" "Type",
    "title" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "city" TEXT,
    "eventPartner" TEXT,
    "officialPartner" BOOLEAN NOT NULL DEFAULT false,
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "venueName" TEXT,
    "fullAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "entryPrice" DECIMAL(10,2),
    "capacity" INTEGER,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "genderMix" "GenderMix",
    "eventIntent" "EventIntent",
    "heroImage" TEXT,
    "aboutEvent" TEXT,
    "dressCode" "DressCode",
    "refundWindow" INTEGER,
    "termsConditions" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "basicsDone" BOOLEAN NOT NULL DEFAULT false,
    "hostDone" BOOLEAN NOT NULL DEFAULT false,
    "venueDone" BOOLEAN NOT NULL DEFAULT false,
    "ticketDone" BOOLEAN NOT NULL DEFAULT false,
    "experienceDone" BOOLEAN NOT NULL DEFAULT false,
    "safetyDone" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGallery" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAmenity" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventItinerary" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWhyCome" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventWhyCome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSafety" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "EventSafety_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_city_idx" ON "Event"("city");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_currentStep_idx" ON "Event"("currentStep");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_incomeRange_workingWith_idx" ON "user_edu_work"("highestEdu", "incomeRange", "workingWith");

-- AddForeignKey
ALTER TABLE "EventGallery" ADD CONSTRAINT "EventGallery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAmenity" ADD CONSTRAINT "EventAmenity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventItinerary" ADD CONSTRAINT "EventItinerary_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWhyCome" ADD CONSTRAINT "EventWhyCome_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSafety" ADD CONSTRAINT "EventSafety_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
