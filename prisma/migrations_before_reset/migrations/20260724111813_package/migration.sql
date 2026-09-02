/*
  Warnings:

  - You are about to drop the column `unit` on the `plan_limits` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ResetPeriod" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "plan_limits" DROP COLUMN "unit",
ADD COLUMN     "resetPeriod" "ResetPeriod" NOT NULL DEFAULT 'NONE';

-- CreateIndex
CREATE INDEX "plan_limits_packageId_idx" ON "plan_limits"("packageId");

-- CreateIndex
CREATE INDEX "plan_limits_featureId_idx" ON "plan_limits"("featureId");

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
