/*
  Warnings:

  - You are about to drop the column `packageId` on the `Payment` table. All the data in the column will be lost.
  - The primary key for the `UserBlock` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `UserReport` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[paymentId]` on the table `waitlists` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `id` on the `UserBlock` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `UserReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WaitlistPlan" AS ENUM ('FREE', 'PAID');

-- AlterEnum
ALTER TYPE "PaymentPurpose" ADD VALUE 'WALLET';

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "packageId",
ADD COLUMN     "referenceId" UUID;

-- AlterTable
ALTER TABLE "UserBlock" DROP CONSTRAINT "UserBlock_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "UserReport" DROP CONSTRAINT "UserReport_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "waitlists" ADD COLUMN     "plan" "WaitlistPlan" NOT NULL DEFAULT 'FREE';

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_paymentId_key" ON "waitlists"("paymentId");
