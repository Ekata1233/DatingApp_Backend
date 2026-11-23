/*
  Warnings:

  - The values [MIXED,SERIOUS,CASUAL] on the enum `EventIntent` will be removed. If these variants are still used in the database, this will fail.
  - The values [LIVE,SOLD_OUT] on the enum `EventStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Event` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventAmenity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventCancelFAQ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventFAQ` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventFeatureTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventGallery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventItinerary` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventSafety` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EventWhyCome` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[value,eventDurationType]` on the table `partner_event_categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `eventDurationType` to the `partner_event_categories` table without a default value. This is not possible if the table is not empty.
  - Made the column `eventDurationType` on table `your_events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `baseCity` on table `your_events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `targetAudience` on table `your_events` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EventReviewStatus" AS ENUM ('PENDING', 'PUBLISHED', 'HIDDEN', 'REJECTED');

-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('GROUP_TRIP', 'COUPLES_TRIP');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('FREE_AND_PREMIUM', 'VIP_AND_VIP_ELITE');

-- CreateEnum
CREATE TYPE "EventPhotoType" AS ENUM ('EVENT', 'HIGHLIGHT');

-- CreateEnum
CREATE TYPE "EventDateStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "VenueType" AS ENUM ('CAFE_BAR', 'RESTAURANT', 'STUDIO', 'ROOFTOP', 'OUTDOOR_TRAIL', 'CAMPSITE', 'RESORT_VILLA', 'PUBLIC_PLACE');

-- CreateEnum
CREATE TYPE "EventPriceType" AS ENUM ('PER_PERSON', 'PER_COUPLE');

-- CreateEnum
CREATE TYPE "CrowdMix" AS ENUM ('BALANCED', 'OPEN');

-- CreateEnum
CREATE TYPE "EventDressCode" AS ENUM ('NONE', 'CASUAL', 'SMART_CASUAL', 'ACTIVEWEAR', 'TREK_GEAR', 'ETHNIC', 'ALL_WHITE');

-- CreateEnum
CREATE TYPE "TravelType" AS ENUM ('AC_SLEEPER_BUS', 'AC_SEATER_BUS', 'TEMPO_TRAVELLER', 'TRAIN_3AC', 'SELF_DRIVE_CONVOY', 'FLIGHT', 'PRIVATE_CAB');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'BRUNCH', 'LUNCH', 'SNACKS', 'DINNER');

-- CreateEnum
CREATE TYPE "TripLevel" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "TripNightType" AS ENUM ('STAY', 'OVERNIGHT_TRAVEL', 'RETURN_HOME');

-- CreateEnum
CREATE TYPE "TripStopTag" AS ENUM ('NONE', 'INCLUDED', 'NOT_INCLUDED', 'PICK_ONE', 'PICKUP_POINT', 'DROP_OFF_POINT');

-- CreateEnum
CREATE TYPE "RoomSharing" AS ENUM ('TWIN_SHARING', 'DORM', 'TENT_SHARING', 'TRIPLE_SHARING', 'PRIVATE_ROOM');

-- CreateEnum
CREATE TYPE "EventCancellationPolicy" AS ENUM ('STANDARD', 'TRIPS_AND_CAMPING', 'STRICT');

-- CreateEnum
CREATE TYPE "EventSafetyOption" AS ENUM ('TRAINED_HOST', 'VETTED_VENUE', 'WOMAN_ON_HOST_TEAM', 'SEPARATE_ROOMS_FOR_WOMEN', 'SAFETY_BRIEF_AND_SOS', 'RESPONSIBLE_ALCOHOL_SERVICE', 'IDENTITY_CHECK', 'CONTROLLED_ENTRY', 'CCTV_MONITORED');

-- CreateEnum
CREATE TYPE "EventAvailabilityStatus" AS ENUM ('DRAFT', 'LIVE', 'SOLD_OUT', 'CANCELLED');


-- DropForeignKey
ALTER TABLE "ChatMessage" DROP CONSTRAINT "ChatMessage_eventId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_businessDetailsId_fkey";

-- DropForeignKey
ALTER TABLE "EventAmenity" DROP CONSTRAINT "EventAmenity_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventBooking" DROP CONSTRAINT "EventBooking_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventFAQ" DROP CONSTRAINT "EventFAQ_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventFeatureTag" DROP CONSTRAINT "EventFeatureTag_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventGallery" DROP CONSTRAINT "EventGallery_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventItinerary" DROP CONSTRAINT "EventItinerary_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventSafety" DROP CONSTRAINT "EventSafety_eventId_fkey";

-- DropForeignKey
ALTER TABLE "EventWhyCome" DROP CONSTRAINT "EventWhyCome_eventId_fkey";

-- DropForeignKey
ALTER TABLE "event_hosts" DROP CONSTRAINT "event_hosts_eventId_fkey";

-- DropIndex
DROP INDEX "partner_event_categories_value_key";

-- AlterTable
ALTER TABLE "partner_event_categories"
ADD COLUMN "eventDurationType" "EventDurationType";

UPDATE "partner_event_categories"
SET "eventDurationType" = 'SINGLE_DAY'
WHERE "eventDurationType" IS NULL;

ALTER TABLE "partner_event_categories"
ALTER COLUMN "eventDurationType" SET NOT NULL;

-- AlterTable
ALTER TABLE "your_events" ALTER COLUMN "eventDurationType" SET NOT NULL,
ALTER COLUMN "baseCity" SET NOT NULL,
ALTER COLUMN "targetAudience" SET NOT NULL;

-- DropTable
DROP TABLE "Event";

-- DropTable
DROP TABLE "EventAmenity";

-- DropTable
DROP TABLE "EventCancelFAQ";

-- DropTable
DROP TABLE "EventFAQ";

-- DropTable
DROP TABLE "EventFeatureTag";

-- DropTable
DROP TABLE "EventGallery";

-- DropTable
DROP TABLE "EventItinerary";

-- DropTable
DROP TABLE "EventSafety";

-- DropTable
DROP TABLE "EventWhyCome";

-- Replace old event enums
DROP TYPE "EventIntent";

CREATE TYPE "EventIntent" AS ENUM (
  'SERIOUS_DATING',
  'CASUAL_SOCIAL',
  'OPEN_TO_BOTH'
);

DROP TYPE "EventStatus";

CREATE TYPE "EventStatus" AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED'
);
-- DropEnum
DROP TYPE "EventTag";

-- DropEnum
DROP TYPE "EventType";

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "businessDetailsId" UUID,
    "eventDurationType" "EventDurationType",
    "tripType" "TripType",
    "categoryId" UUID,
    "title" TEXT,
    "tagline" TEXT,
    "about" TEXT,
    "visibility" "EventVisibility",
    "highlightsCaption" TEXT,
    "experienceSubtitle" TEXT,
    "priceType" "EventPriceType" NOT NULL DEFAULT 'PER_PERSON',
    "totalCapacity" INTEGER,
    "menCapacity" INTEGER,
    "womenCapacity" INTEGER,
    "otherCapacity" INTEGER,
    "menEntryPrice" DECIMAL(10,2),
    "womenEntryPrice" DECIMAL(10,2),
    "otherEntryPrice" DECIMAL(10,2),
    "menDiscountPercentage" DECIMAL(5,2),
    "womenDiscountPercentage" DECIMAL(5,2),
    "otherDiscountPercentage" DECIMAL(5,2),
    "menDiscountedPrice" DECIMAL(10,2),
    "womenDiscountedPrice" DECIMAL(10,2),
    "otherDiscountedPrice" DECIMAL(10,2),
    "coupleCapacity" INTEGER,
    "coupleEntryPrice" DECIMAL(10,2),
    "coupleDiscountPercentage" DECIMAL(5,2),
    "coupleDiscountedPrice" DECIMAL(10,2),
    "maxTicketsPerPerson" INTEGER NOT NULL DEFAULT 1,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "crowdMix" "CrowdMix",
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "groupSize" INTEGER,
    "intent" "EventIntent",
    "included" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notIncluded" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "whatToBring" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dressCode" "EventDressCode" NOT NULL DEFAULT 'NONE',
    "groupChatTitle" TEXT,
    "groupChatDescription" TEXT,
    "groupChatOpensAt" TIMESTAMP(3),
    "reminderTitle" TEXT,
    "reminderDescription" TEXT,
    "reminderTimes" TIMESTAMP(3)[] DEFAULT ARRAY[]::TIMESTAMP(3)[],
    "hostId" UUID,
    "hostPhotoUrl" TEXT,
    "hostTitle" TEXT,
    "hostSpeciality" TEXT,
    "hostLanguages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hostMessage" TEXT,
    "afterEventLine" TEXT,
    "cancellationPolicy" "EventCancellationPolicy",
    "cancellationDescription" TEXT,
    "refundPolicy" TEXT,
    "reschedulingPolicy" TEXT,
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safetyOptions" "EventSafetyOption"[] DEFAULT ARRAY[]::"EventSafetyOption"[],
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "averageRating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_photos" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "fileId" TEXT,
    "photoType" "EventPhotoType" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_dates" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "startDateTime" TIMESTAMP(3) NOT NULL,
    "endDateTime" TIMESTAMP(3),
    "gateOpensAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "status" "EventDateStatus" NOT NULL DEFAULT 'SCHEDULED',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isMoreDate" BOOLEAN NOT NULL DEFAULT false,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_venues" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "venueName" TEXT,
    "fullAddress" TEXT,
    "venueType" "VenueType",
    "venueCapacity" INTEGER,
    "whySpecial" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrl" TEXT,
    "exactMeetingPoint" TEXT,
    "distanceFromCity" TEXT,
    "landmark" TEXT,
    "parking" TEXT,
    "publicTransport" TEXT,
    "googleMapsLink" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_experiences" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_details" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "totalDays" INTEGER NOT NULL DEFAULT 2,
    "travelBy" "TravelType",
    "pickupCity" TEXT,
    "pickupPoint" TEXT,
    "exactPickupSpot" TEXT,
    "pickupMapsLink" TEXT,
    "pickupLatitude" DOUBLE PRECISION,
    "pickupLongitude" DOUBLE PRECISION,
    "destinationPlace" TEXT,
    "destinationArea" TEXT,
    "journeyThere" TEXT,
    "journeyBack" TEXT,
    "destinationIcon" TEXT,
    "dropCity" TEXT,
    "dropPoint" TEXT,
    "roomSharing" "RoomSharing",
    "stayTile" TEXT,
    "mealsTile" TEXT,
    "vehiclePhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "vehicle" TEXT NOT NULL,
    "vehicleOperator" TEXT,
    "vehicleModel" TEXT,
    "vehicleCapacity" INTEGER,
    "vehicleSpecs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "onBoard" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "safetyNoteTitle" TEXT,
    "safetyNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_days" (
    "id" UUID NOT NULL,
    "tripDetailsId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "headline" TEXT,
    "photoUrl" TEXT,
    "highlightPhotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mealsIncluded" "MealType"[] DEFAULT ARRAY[]::"MealType"[],
    "level" "TripLevel",
    "nightType" "TripNightType",
    "stayId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stops" (
    "id" UUID NOT NULL,
    "tripDayId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "timeLabel" TEXT,
    "icon" TEXT,
    "tag" "TripStopTag" NOT NULL DEFAULT 'NONE',
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_stays" (
    "id" UUID NOT NULL,
    "tripDetailsId" UUID NOT NULL,
    "stayName" TEXT,
    "area" TEXT,
    "tagline" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "checkIn" TEXT,
    "checkOut" TEXT,
    "address" TEXT,
    "contact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_stays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_places" (
    "id" UUID NOT NULL,
    "tripDetailsId" UUID NOT NULL,
    "icon" TEXT,
    "name" TEXT,
    "when" TEXT,
    "whySpecial" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrl" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_games" (
    "id" UUID NOT NULL,
    "tripDayId" UUID NOT NULL,
    "icon" TEXT,
    "name" TEXT,
    "howItPlays" TEXT,
    "whyItWorks" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip_room_options" (
    "id" UUID NOT NULL,
    "tripDetailsId" UUID NOT NULL,
    "name" TEXT,
    "shortNote" TEXT,
    "upgradePrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "isIncluded" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_room_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_faqs" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "question" TEXT,
    "answer" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_reviews" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "eventDateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "review" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "EventReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "organizerReply" TEXT,
    "repliedAt" TIMESTAMP(3),
    "repliedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_hostId_idx" ON "events"("hostId");

-- CreateIndex
CREATE INDEX "events_businessDetailsId_idx" ON "events"("businessDetailsId");

-- CreateIndex
CREATE INDEX "events_categoryId_idx" ON "events"("categoryId");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_visibility_status_idx" ON "events"("visibility", "status");

-- CreateIndex
CREATE INDEX "events_eventDurationType_status_idx" ON "events"("eventDurationType", "status");

-- CreateIndex
CREATE INDEX "events_businessDetailsId_status_updatedAt_idx" ON "events"("businessDetailsId", "status", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "event_photos_eventId_photoType_sortOrder_key" ON "event_photos"("eventId", "photoType", "sortOrder");

-- CreateIndex
CREATE INDEX "event_dates_eventId_status_idx" ON "event_dates"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_dates_status_startDateTime_idx" ON "event_dates"("status", "startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "event_dates_eventId_startDateTime_key" ON "event_dates"("eventId", "startDateTime");

-- CreateIndex
CREATE UNIQUE INDEX "event_venues_eventId_key" ON "event_venues"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_experiences_eventId_sortOrder_key" ON "event_experiences"("eventId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "trip_details_eventId_key" ON "trip_details"("eventId");

-- CreateIndex
CREATE INDEX "trip_days_stayId_idx" ON "trip_days"("stayId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_days_tripDetailsId_dayNumber_key" ON "trip_days"("tripDetailsId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "trip_stops_tripDayId_sortOrder_key" ON "trip_stops"("tripDayId", "sortOrder");

-- CreateIndex
CREATE INDEX "trip_stays_tripDetailsId_idx" ON "trip_stays"("tripDetailsId");

-- CreateIndex
CREATE UNIQUE INDEX "trip_places_tripDetailsId_sortOrder_key" ON "trip_places"("tripDetailsId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "trip_games_tripDayId_sortOrder_key" ON "trip_games"("tripDayId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "trip_room_options_tripDetailsId_sortOrder_key" ON "trip_room_options"("tripDetailsId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "event_faqs_eventId_sortOrder_key" ON "event_faqs"("eventId", "sortOrder");

-- CreateIndex
CREATE INDEX "event_reviews_eventId_status_idx" ON "event_reviews"("eventId", "status");

-- CreateIndex
CREATE INDEX "event_reviews_eventId_rating_idx" ON "event_reviews"("eventId", "rating");

-- CreateIndex
CREATE INDEX "event_reviews_userId_idx" ON "event_reviews"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "event_reviews_eventDateId_userId_key" ON "event_reviews"("eventDateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_event_categories_value_eventDurationType_key" ON "partner_event_categories"("value", "eventDurationType");

-- AddForeignKey
ALTER TABLE "event_hosts" ADD CONSTRAINT "event_hosts_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_businessDetailsId_fkey" FOREIGN KEY ("businessDetailsId") REFERENCES "business_details"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "partner_event_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "hosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_photos" ADD CONSTRAINT "event_photos_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_dates" ADD CONSTRAINT "event_dates_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_venues" ADD CONSTRAINT "event_venues_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_experiences" ADD CONSTRAINT "event_experiences_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_details" ADD CONSTRAINT "trip_details_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_tripDetailsId_fkey" FOREIGN KEY ("tripDetailsId") REFERENCES "trip_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_days" ADD CONSTRAINT "trip_days_stayId_fkey" FOREIGN KEY ("stayId") REFERENCES "trip_stays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "trip_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_stays" ADD CONSTRAINT "trip_stays_tripDetailsId_fkey" FOREIGN KEY ("tripDetailsId") REFERENCES "trip_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_places" ADD CONSTRAINT "trip_places_tripDetailsId_fkey" FOREIGN KEY ("tripDetailsId") REFERENCES "trip_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_games" ADD CONSTRAINT "trip_games_tripDayId_fkey" FOREIGN KEY ("tripDayId") REFERENCES "trip_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_room_options" ADD CONSTRAINT "trip_room_options_tripDetailsId_fkey" FOREIGN KEY ("tripDetailsId") REFERENCES "trip_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_faqs" ADD CONSTRAINT "event_faqs_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_eventDateId_fkey" FOREIGN KEY ("eventDateId") REFERENCES "event_dates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_reviews" ADD CONSTRAINT "event_reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
