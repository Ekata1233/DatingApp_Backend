/*
  Warnings:

  - The values [SIGNED_UP,PURCHASED,REWARDED] on the enum `ReferralStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `signupReward` on the `UserReferral` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `purchaseReward` on the `UserReferral` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - A unique constraint covering the columns `[payment_id]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ReferralStatus_new" AS ENUM ('PENDING', 'SIGNUP_REWARDED', 'PACKAGE_REWARDED', 'WAITLIST_REWARDED', 'CANCELLED');
ALTER TABLE "UserReferral" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "UserReferral"
ALTER COLUMN "status"
TYPE "ReferralStatus_new"
USING (
  CASE "status"::text
    WHEN 'SIGNED_UP' THEN 'SIGNUP_REWARDED'
    WHEN 'PURCHASED' THEN 'PACKAGE_REWARDED'
    WHEN 'REWARDED' THEN 'PACKAGE_REWARDED'
    ELSE "status"::text
  END::"ReferralStatus_new"
);
ALTER TYPE "ReferralStatus" RENAME TO "ReferralStatus_old";
ALTER TYPE "ReferralStatus_new" RENAME TO "ReferralStatus";
DROP TYPE "ReferralStatus_old";
ALTER TABLE "UserReferral" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "UserReferral" ALTER COLUMN "signupReward" SET DEFAULT 0,
ALTER COLUMN "signupReward" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "purchaseReward" SET DEFAULT 0,
ALTER COLUMN "purchaseReward" SET DATA TYPE DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "Payment_payment_id_key" ON "Payment"("payment_id");
