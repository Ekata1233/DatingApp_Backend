/*
  Warnings:

  - You are about to drop the `features` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL', 'LLP', 'PRIVATE_LIMITED', 'PARTNERSHIP', 'OPC', 'NGO', 'OTHER');

-- DropForeignKey
ALTER TABLE "plan_limits" DROP CONSTRAINT "plan_limits_featureId_fkey";

-- DropForeignKey
ALTER TABLE "user_plan_usage" DROP CONSTRAINT "user_plan_usage_featureId_fkey";

-- DropTable
DROP TABLE "features";

-- CreateTable
CREATE TABLE "package_feature" (
    "id" UUID NOT NULL,
    "category" "FeatureCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_partners" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "experienceYears" INTEGER,
    "description" TEXT,
    "monthlyEventsMin" INTEGER,
    "monthlyEventsMax" INTEGER,
    "teamSize" INTEGER,
    "venueNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "areaName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "coverageAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "logo" TEXT,
    "gstCertificate" TEXT,
    "businessProof" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "package_feature_code_key" ON "package_feature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_email_key" ON "event_partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_gstNumber_key" ON "event_partners"("gstNumber");

-- CreateIndex
CREATE INDEX "event_partners_businessName_idx" ON "event_partners"("businessName");

-- CreateIndex
CREATE INDEX "event_partners_city_idx" ON "event_partners"("city");

-- CreateIndex
CREATE INDEX "event_partners_state_idx" ON "event_partners"("state");

-- CreateIndex
CREATE INDEX "event_partners_status_idx" ON "event_partners"("status");

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "package_feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_usage" ADD CONSTRAINT "user_plan_usage_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "package_feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
