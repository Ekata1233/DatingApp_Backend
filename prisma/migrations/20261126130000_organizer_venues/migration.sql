-- CreateEnum
CREATE TYPE "VenueArrangement" AS ENUM ('PARTNER_VENUE', 'OWNED_BY_US', 'PUBLIC_PLACE_TRAIL');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "organizerVenueId" UUID;

-- CreateTable
CREATE TABLE "organizer_venues" (
    "id" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "venueName" TEXT NOT NULL,
    "fullAddress" TEXT NOT NULL,
    "venueCapacity" INTEGER NOT NULL,
    "venueType" "VenueType" NOT NULL,
    "arrangement" "VenueArrangement" NOT NULL,
    "nocDocumentKey" TEXT,
    "nocDocumentName" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "googleMapsLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organizer_venue_photos" (
    "id" UUID NOT NULL,
    "venueId" UUID NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "fileId" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_venue_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "organizer_venues_businessId_isActive_isDeleted_idx" ON "organizer_venues"("businessId", "isActive", "isDeleted");

-- CreateIndex
CREATE INDEX "organizer_venues_businessId_venueType_idx" ON "organizer_venues"("businessId", "venueType");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_venue_photos_venueId_sortOrder_key" ON "organizer_venue_photos"("venueId", "sortOrder");

-- CreateIndex
CREATE INDEX "events_organizerVenueId_idx" ON "events"("organizerVenueId");

-- AddForeignKey
ALTER TABLE "organizer_venues" ADD CONSTRAINT "organizer_venues_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "business_details"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organizer_venue_photos" ADD CONSTRAINT "organizer_venue_photos_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "organizer_venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizerVenueId_fkey" FOREIGN KEY ("organizerVenueId") REFERENCES "organizer_venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

