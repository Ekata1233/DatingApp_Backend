/*
  Warnings:

  - The values [REFERRAL_REWARD] on the enum `TransactionSource` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `Payment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `provider` on the `Payment` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Package` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackageFeature` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PackagePlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserPackage` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[referralCode]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `purpose` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'SIGNED_UP', 'PURCHASED', 'REWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('MATCH_DISCOVERY', 'CHAT', 'TRUST', 'PRIVACY', 'STATUS', 'EVENTS', 'PERKS', 'FOREVER_LOVE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('WAITLIST', 'PACKAGE', 'BOOST', 'COINS');

-- CreateEnum
CREATE TYPE "WaitlistSource" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'YOUTUBE', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "LaunchBenefit" AS ENUM ('ONE_MONTH_PREMIUM', 'THREE_MONTH_PREMIUM', 'LIFETIME_DISCOUNT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PackageStatus" ADD VALUE 'PENDING';
ALTER TYPE "PackageStatus" ADD VALUE 'FAILED';
ALTER TYPE "PackageStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionSource_new" AS ENUM ('WALLET_TOPUP', 'PREMIUM_PLAN', 'BOOST_PURCHASE', 'SUPER_LIKE', 'DATE_PLAN_BOOKING', 'DATE_PLAN_REFUND', 'WITHDRAWAL', 'REFERRAL_SIGNUP', 'REFERRAL_PURCHASE');
ALTER TABLE "WalletTransaction" ALTER COLUMN "source" TYPE "TransactionSource_new" USING ("source"::text::"TransactionSource_new");
ALTER TYPE "TransactionSource" RENAME TO "TransactionSource_old";
ALTER TYPE "TransactionSource_new" RENAME TO "TransactionSource";
DROP TYPE "TransactionSource_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "PackageFeature" DROP CONSTRAINT "PackageFeature_packageId_fkey";

-- DropForeignKey
ALTER TABLE "PackagePlan" DROP CONSTRAINT "PackagePlan_packageId_fkey";

-- DropForeignKey
ALTER TABLE "UserPackage" DROP CONSTRAINT "UserPackage_packageId_fkey";

-- DropForeignKey
ALTER TABLE "UserPackage" DROP CONSTRAINT "UserPackage_planId_fkey";

-- DropForeignKey
ALTER TABLE "UserPackage" DROP CONSTRAINT "UserPackage_user_id_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_pkey",
DROP COLUMN "provider",
ADD COLUMN     "gatewayResponse" JSONB,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "purpose" "PaymentPurpose" NOT NULL,
ADD COLUMN     "transactionId" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "currency" SET DEFAULT 'INR',
DROP COLUMN "status",
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "payment_id" DROP NOT NULL,
ALTER COLUMN "payment_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Payment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referralCode" VARCHAR(20);

-- DropTable
DROP TABLE "Package";

-- DropTable
DROP TABLE "PackageFeature";

-- DropTable
DROP TABLE "PackagePlan";

-- DropTable
DROP TABLE "UserPackage";

-- DropEnum
DROP TYPE "PackageType";

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" UUID NOT NULL,
    "referrerId" UUID NOT NULL,
    "referredUserId" UUID NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "signupReward" INTEGER NOT NULL DEFAULT 0,
    "purchaseReward" INTEGER NOT NULL DEFAULT 0,
    "rewardedAt" TIMESTAMP(3),
    "purchaseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferralStats" (
    "userId" UUID NOT NULL,
    "totalInvites" INTEGER NOT NULL DEFAULT 0,
    "joinedUsers" INTEGER NOT NULL DEFAULT 0,
    "purchasedUsers" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "pendingRewards" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferralStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "package" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "badgeLabel" TEXT,
    "discoveryPool" TEXT,
    "visibilityRule" TEXT,
    "description" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "months" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "discountPercent" INTEGER,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "features" (
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

    CONSTRAINT "features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "unlimited" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_packages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "priceId" UUID NOT NULL,
    "purchasePrice" DECIMAL(65,30) NOT NULL,
    "purchaseOriginalPrice" DECIMAL(65,30),
    "purchaseDiscount" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" UUID,
    "currentPackageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plan_usage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plan_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "waitlistNumber" INTEGER NOT NULL,
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "launchBenefit" "LaunchBenefit" NOT NULL DEFAULT 'ONE_MONTH_PREMIUM',
    "premiumActivated" BOOLEAN NOT NULL DEFAULT false,
    "premiumActivatedAt" TIMESTAMP(3),
    "source" "WaitlistSource",
    "paymentId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchConfig" (
    "id" UUID NOT NULL,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appLaunched" BOOLEAN NOT NULL DEFAULT false,
    "launchDate" TIMESTAMP(3),
    "waitlistPrice" DECIMAL(10,2) NOT NULL DEFAULT 300,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_referredUserId_key" ON "UserReferral"("referredUserId");

-- CreateIndex
CREATE INDEX "UserReferral_status_idx" ON "UserReferral"("status");

-- CreateIndex
CREATE INDEX "UserReferral_referrerId_idx" ON "UserReferral"("referrerId");

-- CreateIndex
CREATE INDEX "UserReferral_referredUserId_idx" ON "UserReferral"("referredUserId");

-- CreateIndex
CREATE INDEX "UserReferral_createdAt_idx" ON "UserReferral"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "package_slug_key" ON "package"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_packageId_billingCycle_key" ON "plan_prices"("packageId", "billingCycle");

-- CreateIndex
CREATE UNIQUE INDEX "features_code_key" ON "features"("code");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_packageId_featureId_key" ON "plan_limits"("packageId", "featureId");

-- CreateIndex
CREATE INDEX "user_packages_user_id_idx" ON "user_packages"("user_id");

-- CreateIndex
CREATE INDEX "user_packages_packageId_idx" ON "user_packages"("packageId");

-- CreateIndex
CREATE INDEX "user_packages_status_idx" ON "user_packages"("status");

-- CreateIndex
CREATE INDEX "user_packages_endDate_idx" ON "user_packages"("endDate");

-- CreateIndex
CREATE INDEX "user_plan_usage_userId_idx" ON "user_plan_usage"("userId");

-- CreateIndex
CREATE INDEX "user_plan_usage_featureId_idx" ON "user_plan_usage"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_usage_userId_featureId_key" ON "user_plan_usage"("userId", "featureId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_userId_key" ON "waitlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_waitlistNumber_key" ON "waitlists"("waitlistNumber");

-- CreateIndex
CREATE INDEX "waitlists_paymentStatus_idx" ON "waitlists"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralStats" ADD CONSTRAINT "UserReferralStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_currentPackageId_fkey" FOREIGN KEY ("currentPackageId") REFERENCES "package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_usage" ADD CONSTRAINT "user_plan_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_usage" ADD CONSTRAINT "user_plan_usage_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "features"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
