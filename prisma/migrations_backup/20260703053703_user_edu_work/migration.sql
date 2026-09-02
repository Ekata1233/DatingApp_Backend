/*
  Warnings:

  - You are about to drop the column `companyName` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `incomeRange` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `maxIncome` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `minIncome` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `workStyle` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `workingAs` on the `user_edu_work` table. All the data in the column will be lost.
  - You are about to drop the column `workingWith` on the `user_edu_work` table. All the data in the column will be lost.
  - The `highestEdu` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'ITI', 'DIPLOMA', 'UNDERGRADUATE', 'BACHELOR', 'POSTGRADUATE', 'MASTER', 'MPHIL', 'PHD', 'POST_DOCTORATE');

-- DropIndex
DROP INDEX "user_edu_work_highestEdu_incomeRange_workingWith_idx";

-- DropIndex
DROP INDEX "user_edu_work_incomeRange_idx";

-- DropIndex
DROP INDEX "user_edu_work_minIncome_maxIncome_idx";

-- DropIndex
DROP INDEX "user_edu_work_workStyle_idx";

-- DropIndex
DROP INDEX "user_edu_work_workingWith_idx";

-- AlterTable
ALTER TABLE "user_edu_work" DROP COLUMN "companyName",
DROP COLUMN "incomeRange",
DROP COLUMN "maxIncome",
DROP COLUMN "minIncome",
DROP COLUMN "workStyle",
DROP COLUMN "workingAs",
DROP COLUMN "workingWith",
ADD COLUMN     "ambitionId" UUID,
ADD COLUMN     "employmentTypeId" UUID,
ADD COLUMN     "experienceId" UUID,
ADD COLUMN     "professionId" UUID,
ADD COLUMN     "salaryRangeId" UUID,
DROP COLUMN "highestEdu",
ADD COLUMN     "highestEdu" "EducationLevel";

-- DropEnum
DROP TYPE "WorkStyle";

-- CreateTable
CREATE TABLE "professions" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_types" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambitions" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_ranges" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "minSalary" INTEGER,
    "maxSalary" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professions_name_key" ON "professions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_name_key" ON "employment_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_title_key" ON "experiences"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ambitions_title_key" ON "ambitions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "salary_ranges_title_key" ON "salary_ranges"("title");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_professionId_idx" ON "user_edu_work"("professionId");

-- CreateIndex
CREATE INDEX "user_edu_work_employmentTypeId_idx" ON "user_edu_work"("employmentTypeId");

-- CreateIndex
CREATE INDEX "user_edu_work_experienceId_idx" ON "user_edu_work"("experienceId");

-- CreateIndex
CREATE INDEX "user_edu_work_ambitionId_idx" ON "user_edu_work"("ambitionId");

-- CreateIndex
CREATE INDEX "user_edu_work_salaryRangeId_idx" ON "user_edu_work"("salaryRangeId");

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_employmentTypeId_fkey" FOREIGN KEY ("employmentTypeId") REFERENCES "employment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_ambitionId_fkey" FOREIGN KEY ("ambitionId") REFERENCES "ambitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_salaryRangeId_fkey" FOREIGN KEY ("salaryRangeId") REFERENCES "salary_ranges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
