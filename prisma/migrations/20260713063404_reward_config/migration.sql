/*
  Warnings:

  - The values [PAID] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PromptVisibility" AS ENUM ('EVERYONE', 'PREMIUM_AND_ABOVE', 'VIP_AND_ABOVE', 'ELITE_ONLY');

-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'OTHER';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');
ALTER TABLE "Payment" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "waitlists" ALTER COLUMN "paymentStatus" DROP DEFAULT;
ALTER TABLE "Payment" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TABLE "waitlists" ALTER COLUMN "paymentStatus" TYPE "PaymentStatus_new" USING ("paymentStatus"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "PaymentStatus_old";
ALTER TABLE "Payment" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "waitlists" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "visibility" "PromptVisibility" NOT NULL DEFAULT 'EVERYONE';

-- CreateTable
CREATE TABLE "reward_config" (
    "id" UUID NOT NULL,
    "signupReward" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "packageReward" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "waitlistReward" DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    "title" VARCHAR(100) NOT NULL DEFAULT 'How Rewards Work',
    "descriptions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_config_pkey" PRIMARY KEY ("id")
);
