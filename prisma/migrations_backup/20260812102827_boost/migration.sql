-- AlterTable
ALTER TABLE "boosts" ADD COLUMN     "boostDuration" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "boostVsSuperBoost" JSONB,
ADD COLUMN     "singleBoostWalletPrice" DECIMAL(10,2) NOT NULL DEFAULT 60,
ADD COLUMN     "visibilityMultiplier" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "whyBoostWorks" JSONB;
