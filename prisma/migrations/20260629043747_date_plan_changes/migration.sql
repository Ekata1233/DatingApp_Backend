/*
  Warnings:

  - You are about to drop the `UserDatePlanStats` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "PlanStatus" ADD VALUE 'BOOKED';

-- DropForeignKey
ALTER TABLE "UserDatePlanStats" DROP CONSTRAINT "UserDatePlanStats_userId_fkey";

-- DropTable
DROP TABLE "UserDatePlanStats";

-- CreateTable
CREATE TABLE "DatePlanUserStats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanUserStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanUserStats_userId_key" ON "DatePlanUserStats"("userId");

-- AddForeignKey
ALTER TABLE "DatePlanUserStats" ADD CONSTRAINT "DatePlanUserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
