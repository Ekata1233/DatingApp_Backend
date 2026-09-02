/*
  Warnings:

  - You are about to alter the column `message` on the `UserCompliment` table. The data in that column could be lost. The data in that column will be cast from `VarChar(250)` to `VarChar(140)`.
  - You are about to drop the column `boost_id` on the `user_boosts` table. All the data in the column will be lost.
  - Added the required column `nextResetAt` to the `UserRoseBalance` table without a default value. This is not possible if the table is not empty.
  - Added the required column `last_reset_at` to the `user_boosts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `next_reset_at` to the `user_boosts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Zodiac" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- CreateEnum
CREATE TYPE "LoveLanguage" AS ENUM ('WORDS_OF_AFFIRMATION', 'QUALITY_TIME', 'ACTS_OF_SERVICE', 'PHYSICAL_TOUCH', 'RECEIVING_GIFTS');

-- CreateEnum
CREATE TYPE "CommunicationStyle" AS ENUM ('PHONE_CALLS_OVER_TEXTS', 'TEXTS_OVER_CALLS', 'VIDEO_CALLS', 'VOICE_NOTES', 'IN_PERSON_ALWAYS', 'A_BIT_OF_EVERYTHING');

-- CreateEnum
CREATE TYPE "BoostTransactionType" AS ENUM ('PURCHASE', 'USE', 'REFUND', 'EXPIRE', 'ADMIN_ADD', 'ADMIN_REMOVE');

-- CreateEnum
CREATE TYPE "RoseTransactionType" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- CreateEnum
CREATE TYPE "ComplimentTransactionType" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- DropForeignKey
ALTER TABLE "user_boosts" DROP CONSTRAINT "user_boosts_boost_id_fkey";

-- DropIndex
DROP INDEX "user_boosts_boost_id_idx";

-- AlterTable
ALTER TABLE "UserCompliment" ALTER COLUMN "message" SET DATA TYPE VARCHAR(140);

-- AlterTable
ALTER TABLE "UserRoseBalance" ADD COLUMN     "freeRoses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextResetAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "totalRoses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalRosesSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyLimit" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "user_about" ADD COLUMN     "communicationStyle" "CommunicationStyle",
ADD COLUMN     "loveLanguage" "LoveLanguage",
ADD COLUMN     "zodiac" "Zodiac";

-- AlterTable
ALTER TABLE "user_boosts" DROP COLUMN "boost_id",
ADD COLUMN     "boostId" UUID,
ADD COLUMN     "last_reset_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "next_reset_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "total_boosts" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "area" VARCHAR(30);

-- CreateTable
CREATE TABLE "BoostPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "boostOptionId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "BoostTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "boostBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosePurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoseTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "RoseTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "roseBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoseTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compliment_balance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalCompliments" INTEGER NOT NULL DEFAULT 0,
    "freeCompliments" INTEGER NOT NULL DEFAULT 0,
    "purchasedCompliments" INTEGER NOT NULL DEFAULT 0,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "totalComplimentsSent" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL,
    "nextResetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_compliment_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplimentPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplimentPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplimentTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ComplimentTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "complimentBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplimentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BoostPurchase_userId_idx" ON "BoostPurchase"("userId");

-- CreateIndex
CREATE INDEX "BoostPurchase_paymentId_idx" ON "BoostPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "BoostPurchase_status_idx" ON "BoostPurchase"("status");

-- CreateIndex
CREATE INDEX "BoostTransaction_userId_idx" ON "BoostTransaction"("userId");

-- CreateIndex
CREATE INDEX "BoostTransaction_type_idx" ON "BoostTransaction"("type");

-- CreateIndex
CREATE INDEX "RosePurchase_userId_idx" ON "RosePurchase"("userId");

-- CreateIndex
CREATE INDEX "RosePurchase_paymentId_idx" ON "RosePurchase"("paymentId");

-- CreateIndex
CREATE INDEX "RosePurchase_status_idx" ON "RosePurchase"("status");

-- CreateIndex
CREATE INDEX "RoseTransaction_userId_idx" ON "RoseTransaction"("userId");

-- CreateIndex
CREATE INDEX "RoseTransaction_type_idx" ON "RoseTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "user_compliment_balance_userId_key" ON "user_compliment_balance"("userId");

-- CreateIndex
CREATE INDEX "ComplimentPurchase_userId_idx" ON "ComplimentPurchase"("userId");

-- CreateIndex
CREATE INDEX "ComplimentPurchase_paymentId_idx" ON "ComplimentPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_userId_idx" ON "ComplimentTransaction"("userId");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_type_idx" ON "ComplimentTransaction"("type");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_userId_createdAt_idx" ON "ComplimentTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserCompliment_senderId_createdAt_idx" ON "UserCompliment"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "UserCompliment_receiverId_createdAt_idx" ON "UserCompliment"("receiverId", "createdAt");

-- CreateIndex
CREATE INDEX "UserRose_createdAt_idx" ON "UserRose"("createdAt");

-- CreateIndex
CREATE INDEX "boost_events_created_at_idx" ON "boost_events"("created_at");

-- CreateIndex
CREATE INDEX "user_boosts_boost_option_id_idx" ON "user_boosts"("boost_option_id");

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boostId_fkey" FOREIGN KEY ("boostId") REFERENCES "boosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_boostOptionId_fkey" FOREIGN KEY ("boostOptionId") REFERENCES "boost_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostTransaction" ADD CONSTRAINT "BoostTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostTransaction" ADD CONSTRAINT "BoostTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "BoostPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseTransaction" ADD CONSTRAINT "RoseTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseTransaction" ADD CONSTRAINT "RoseTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "RosePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compliment_balance" ADD CONSTRAINT "user_compliment_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentTransaction" ADD CONSTRAINT "ComplimentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentTransaction" ADD CONSTRAINT "ComplimentTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ComplimentPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
