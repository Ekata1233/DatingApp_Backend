/*
  Warnings:

  - The `looking_for` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('DATE_TO_MARRY', 'DATING', 'MATURE_CONNECTION');

-- CreateEnum
CREATE TYPE "EducationType" AS ENUM ('BCOM', 'CA_CPA', 'CS', 'BSC_BFIN', 'MCOM', 'MENG', 'MS_ENGINEERING', 'AE', 'AET', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeRangeType" AS ENUM ('UPTO_1_LAKH', 'INR_1_TO_2_LAKH', 'INR_2_TO_4_LAKH', 'INR_4_TO_7_LAKH', 'INR_10_TO_15_LAKH', 'INR_15_TO_20_LAKH', 'INR_20_TO_30_LAKH', 'INR_30_TO_50_LAKH', 'INR_50_TO_75_LAKH', 'ABOVE_75_LAKH');

-- CreateEnum
CREATE TYPE "WorkingWith" AS ENUM ('PRIVATE_COMPANY', 'GOVERNMENT', 'CIVIL_SERVICES', 'SELF_EMPLOYED', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "WorkingAs" AS ENUM ('SOFTWARE_ENGINEER', 'DOCTOR', 'TEACHER', 'BUSINESS_OWNER', 'OTHER');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "looking_for",
ADD COLUMN     "looking_for" "LookingFor";

-- CreateTable
CREATE TABLE "user_edu_work" (
    "userId" UUID NOT NULL,
    "highestEdu" "EducationType" NOT NULL,
    "collegeName" VARCHAR(100),
    "incomeRange" "IncomeRangeType" NOT NULL,
    "minIncome" INTEGER,
    "maxIncome" INTEGER,
    "workingWith" "WorkingWith",
    "workingAs" "WorkingAs",
    "companyName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_edu_work_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_incomeRange_idx" ON "user_edu_work"("incomeRange");

-- CreateIndex
CREATE INDEX "user_edu_work_workingWith_idx" ON "user_edu_work"("workingWith");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_incomeRange_workingWith_idx" ON "user_edu_work"("highestEdu", "incomeRange", "workingWith");

-- CreateIndex
CREATE INDEX "user_edu_work_minIncome_maxIncome_idx" ON "user_edu_work"("minIncome", "maxIncome");

-- CreateIndex
CREATE INDEX "users_looking_for_idx" ON "users"("looking_for");

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
