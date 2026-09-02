-- CreateEnum
CREATE TYPE "StoreFeatureType" AS ENUM ('ROSE_SEND_COST', 'REVEAL_ROSE_SENDER', 'COMPLIMENT_SEND_COST', 'REVEAL_COMPLIMENT_SENDER', 'REVEAL_LIKED_YOU', 'BOOST_DURATION', 'BOOST_SINGLE_PRICE', 'BOOST_VISIBILITY_MULTIPLIER', 'SUPER_BOOST_DURATION', 'SUPER_BOOST_SINGLE_PRICE', 'SUPER_BOOST_VISIBILITY_MULTIPLIER', 'DATE_PLAN_POST_COST', 'DATE_PLAN_BOOST_COST', 'DATE_PLAN_FREE_FOR_VIP');

-- CreateEnum
CREATE TYPE "StoreItemType" AS ENUM ('ROSE', 'COMPLIMENT', 'BOOST', 'SUPER_BOOST', 'DATE_PLAN', 'COINS');

-- CreateEnum
CREATE TYPE "StorePackBadge" AS ENUM ('NONE', 'MOST_POPULAR', 'BEST_VALUE');

-- AlterTable
ALTER TABLE "DatePlanUserStats" ADD COLUMN     "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nextResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "purchasedDataPlan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDatePlan" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDetePlanUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyLimit" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "store_features" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "feature" "StoreFeatureType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "intValue" INTEGER,
    "decimalValue" DECIMAL(10,2),
    "boolValue" BOOLEAN,
    "unit" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "premiumFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_packs" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "badge" "StorePackBadge" NOT NULL DEFAULT 'NONE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_packs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_features_feature_key" ON "store_features"("feature");

-- CreateIndex
CREATE INDEX "store_features_feature_idx" ON "store_features"("feature");

-- CreateIndex
CREATE INDEX "store_packs_itemType_isActive_idx" ON "store_packs"("itemType", "isActive");
