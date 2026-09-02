/*
  Warnings:

  - The values [STATUS,EVENTS,FOREVER_LOVE] on the enum `FeatureCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `status` on the `BoostPurchase` table. All the data in the column will be lost.
  - The `paymentId` column on the `BoostPurchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status` on the `ComplimentPurchase` table. All the data in the column will be lost.
  - The `paymentId` column on the `ComplimentPurchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status` on the `RosePurchase` table. All the data in the column will be lost.
  - The `paymentId` column on the `RosePurchase` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `status` on the `date_plan_purchases` table. All the data in the column will be lost.
  - The `paymentId` column on the `date_plan_purchases` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `paymentMethod` to the `BoostPurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `ComplimentPurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `RosePurchase` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentMethod` to the `date_plan_purchases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `package_feature` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PurchasePaymentMethod" AS ENUM ('PACKAGE', 'WALLET', 'PAYMENT_GATEWAY');

-- AlterEnum
BEGIN;
CREATE TYPE "FeatureCategory_new" AS ENUM ('MATCH_DISCOVERY', 'CHAT', 'TRUST', 'PRIVACY', 'STATUS_BADGES', 'REAL_LIFE_EVENTS', 'PERKS', 'FOREVER_LOVE_PROGRAMME', 'ELITE_ACCESS', 'STATUS_PRIVACY', 'PREMIUM_EXPERIENCES', 'NETWORKING_GROWTH', 'EVERYTHING_IN_VIP', 'MAXIMUM_PRIVACY', 'CURATED_ELITE_MATCHING', 'ELITE_STATUS', 'WHITE_GLOVE_EXPERIENCES', 'GLOBAL_EXPERIENCES', 'EXECUTIVE_NETWORK');
ALTER TABLE "package_feature" ALTER COLUMN "category" TYPE "FeatureCategory_new" USING ("category"::text::"FeatureCategory_new");
ALTER TYPE "FeatureCategory" RENAME TO "FeatureCategory_old";
ALTER TYPE "FeatureCategory_new" RENAME TO "FeatureCategory";
DROP TYPE "FeatureCategory_old";
COMMIT;

-- DropIndex
DROP INDEX "BoostPurchase_status_idx";

-- DropIndex
DROP INDEX "RosePurchase_status_idx";

-- DropIndex
DROP INDEX "package_feature_code_key";

-- AlterTable
ALTER TABLE "BoostPurchase" DROP COLUMN "status",
ADD COLUMN     "paymentMethod" "PurchasePaymentMethod" NOT NULL,
ADD COLUMN     "walletTransactionId" UUID,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" UUID;

-- AlterTable
ALTER TABLE "ComplimentPurchase" DROP COLUMN "status",
ADD COLUMN     "paymentMethod" "PurchasePaymentMethod" NOT NULL,
ADD COLUMN     "walletTransactionId" UUID,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" UUID;

-- AlterTable
ALTER TABLE "RosePurchase" DROP COLUMN "status",
ADD COLUMN     "paymentMethod" "PurchasePaymentMethod" NOT NULL,
ADD COLUMN     "walletTransactionId" UUID,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" UUID;

-- AlterTable
ALTER TABLE "date_plan_purchases" DROP COLUMN "status",
ADD COLUMN     "paymentMethod" "PurchasePaymentMethod" NOT NULL,
ADD COLUMN     "walletTransactionId" UUID,
DROP COLUMN "paymentId",
ADD COLUMN     "paymentId" UUID;

-- AlterTable
ALTER TABLE "package_feature" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BoostPurchase_paymentId_idx" ON "BoostPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "ComplimentPurchase_paymentId_idx" ON "ComplimentPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "RosePurchase_paymentId_idx" ON "RosePurchase"("paymentId");

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
