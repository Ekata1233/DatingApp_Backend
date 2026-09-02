/*
  Warnings:

  - The primary key for the `Intention` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Intention` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `ambitions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `ambitions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `employment_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `employment_types` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `experiences` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `experiences` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `professions` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `professions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `salary_ranges` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `salary_ranges` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ambitionId` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `employmentTypeId` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `experienceId` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `professionId` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `salaryRangeId` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `community` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `religion` on the `user_profiles` table. All the data in the column will be lost.
  - The `intentionId` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "user_edu_work" DROP CONSTRAINT "user_edu_work_ambitionId_fkey";

-- DropForeignKey
ALTER TABLE "user_edu_work" DROP CONSTRAINT "user_edu_work_employmentTypeId_fkey";

-- DropForeignKey
ALTER TABLE "user_edu_work" DROP CONSTRAINT "user_edu_work_experienceId_fkey";

-- DropForeignKey
ALTER TABLE "user_edu_work" DROP CONSTRAINT "user_edu_work_professionId_fkey";

-- DropForeignKey
ALTER TABLE "user_edu_work" DROP CONSTRAINT "user_edu_work_salaryRangeId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_intentionId_fkey";

-- DropIndex
DROP INDEX "user_profiles_community_idx";

-- DropIndex
DROP INDEX "user_profiles_religion_idx";

-- AlterTable
ALTER TABLE "Intention" DROP CONSTRAINT "Intention_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Intention_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ambitions" DROP CONSTRAINT "ambitions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "ambitions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "employment_types" DROP CONSTRAINT "employment_types_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "experiences" DROP CONSTRAINT "experiences_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "experiences_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "professions" DROP CONSTRAINT "professions_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "professions_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "salary_ranges" DROP CONSTRAINT "salary_ranges_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "salary_ranges_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user_edu_work" DROP COLUMN "ambitionId",
ADD COLUMN     "ambitionId" INTEGER,
DROP COLUMN "employmentTypeId",
ADD COLUMN     "employmentTypeId" INTEGER,
DROP COLUMN "experienceId",
ADD COLUMN     "experienceId" INTEGER,
DROP COLUMN "professionId",
ADD COLUMN     "professionId" INTEGER,
DROP COLUMN "salaryRangeId",
ADD COLUMN     "salaryRangeId" INTEGER;

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "community",
DROP COLUMN "religion",
ADD COLUMN     "communityId" INTEGER,
ADD COLUMN     "religionId" INTEGER;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "intentionId",
ADD COLUMN     "intentionId" INTEGER;

-- CreateTable
CREATE TABLE "user_languages" (
    "userId" UUID NOT NULL,
    "languageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_languages_pkey" PRIMARY KEY ("userId","languageId")
);

-- CreateTable
CREATE TABLE "religions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" SERIAL NOT NULL,
    "religionId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_languages_languageId_idx" ON "user_languages"("languageId");

-- CreateIndex
CREATE INDEX "user_languages_userId_idx" ON "user_languages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "religions_name_key" ON "religions"("name");

-- CreateIndex
CREATE INDEX "religions_active_idx" ON "religions"("active");

-- CreateIndex
CREATE INDEX "communities_religionId_idx" ON "communities"("religionId");

-- CreateIndex
CREATE INDEX "communities_active_idx" ON "communities"("active");

-- CreateIndex
CREATE UNIQUE INDEX "communities_religionId_name_key" ON "communities"("religionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE INDEX "languages_active_idx" ON "languages"("active");

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

-- CreateIndex
CREATE INDEX "user_profiles_religionId_idx" ON "user_profiles"("religionId");

-- CreateIndex
CREATE INDEX "user_profiles_communityId_idx" ON "user_profiles"("communityId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "Intention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
