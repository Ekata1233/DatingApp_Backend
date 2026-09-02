/*
  Warnings:

  - You are about to drop the column `waitlistPrice` on the `LaunchConfig` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionSource" ADD VALUE 'WAITLIST_REFERRAL_SIGNUP';
ALTER TYPE "TransactionSource" ADD VALUE 'WAITLIST_REFERRAL_PAYMENT';

-- AlterTable
ALTER TABLE "LaunchConfig" DROP COLUMN "waitlistPrice",
ADD COLUMN     "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 500,
ADD COLUMN     "finalPrice" DECIMAL(10,2) NOT NULL DEFAULT 299,
ADD COLUMN     "originalPrice" DECIMAL(10,2) NOT NULL DEFAULT 799,
ADD COLUMN     "perks" JSONB,
ADD COLUMN     "totalBenefitsValue" DECIMAL(10,2),
ADD COLUMN     "welcomeCoins" INTEGER NOT NULL DEFAULT 100;
