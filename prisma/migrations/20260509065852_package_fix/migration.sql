/*
  Warnings:

  - You are about to drop the column `themeColor` on the `Package` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `current_subscription_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `UserSubscription` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[packageId,durationMonths]` on the table `PackagePlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `key` to the `PackageFeature` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WorkStyle" AS ENUM ('REMOTE', 'HYBRID', 'OFFICE', 'FREELANCER', 'BUSINESS_OWNER');

-- CreateEnum
CREATE TYPE "BoostStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_boostOptionId_fkey";

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_current_subscription_id_fkey";

-- DropIndex
DROP INDEX "users_current_subscription_id_key";

-- AlterTable
ALTER TABLE "Package" DROP COLUMN "themeColor";

-- AlterTable
ALTER TABLE "PackageFeature" ADD COLUMN     "key" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PackagePlan" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "subscriptionId",
ADD COLUMN     "packageId" TEXT;

-- AlterTable
ALTER TABLE "user_edu_work" ADD COLUMN     "degree" VARCHAR(100),
ADD COLUMN     "graduationYear" INTEGER,
ADD COLUMN     "workStyle" "WorkStyle";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "current_subscription_id";

-- DropTable
DROP TABLE "UserSubscription";

-- DropEnum
DROP TYPE "SubscriptionStatus";

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPackage" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "packageId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPackage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "user_skills_userId_idx" ON "user_skills"("userId");

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "UserPackage_user_id_idx" ON "UserPackage"("user_id");

-- CreateIndex
CREATE INDEX "PackagePlan_packageId_idx" ON "PackagePlan"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackagePlan_packageId_durationMonths_key" ON "PackagePlan"("packageId", "durationMonths");

-- CreateIndex
CREATE INDEX "user_edu_work_degree_idx" ON "user_edu_work"("degree");

-- CreateIndex
CREATE INDEX "user_edu_work_graduationYear_idx" ON "user_edu_work"("graduationYear");

-- CreateIndex
CREATE INDEX "user_edu_work_workStyle_idx" ON "user_edu_work"("workStyle");

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPackage" ADD CONSTRAINT "UserPackage_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PackagePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
