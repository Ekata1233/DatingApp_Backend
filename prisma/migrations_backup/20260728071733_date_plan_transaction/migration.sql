-- CreateEnum
CREATE TYPE "DatePlanTransactionType" AS ENUM ('PACKAGE_CREDIT', 'USAGE', 'EXPIRED', 'ADMIN_ADJUSTMENT', 'REFUND');

-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'PACKAGE_ACTIVATION';

-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'PACKAGE_BONUS';

-- DropForeignKey
ALTER TABLE "user_boosts" DROP CONSTRAINT "user_boosts_boost_option_id_fkey";

-- AlterTable
ALTER TABLE "UserAnswer" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "user_boosts" ALTER COLUMN "boost_option_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "date_plan_purchases" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "paymentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_plan_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plan_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "DatePlanTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_plan_transactions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boost_option_id_fkey" FOREIGN KEY ("boost_option_id") REFERENCES "boost_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_transactions" ADD CONSTRAINT "date_plan_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_transactions" ADD CONSTRAINT "date_plan_transactions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "date_plan_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
