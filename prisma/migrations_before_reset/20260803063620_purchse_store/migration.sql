-- DropForeignKey
ALTER TABLE "BoostPurchase" DROP CONSTRAINT "BoostPurchase_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "ComplimentPurchase" DROP CONSTRAINT "ComplimentPurchase_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "RosePurchase" DROP CONSTRAINT "RosePurchase_paymentId_fkey";

-- DropForeignKey
ALTER TABLE "date_plan_purchases" DROP CONSTRAINT "date_plan_purchases_paymentId_fkey";

-- AlterTable
ALTER TABLE "BoostPurchase" ALTER COLUMN "paymentId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ComplimentPurchase" ALTER COLUMN "paymentId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "RosePurchase" ALTER COLUMN "paymentId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "date_plan_purchases" ALTER COLUMN "paymentId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;
