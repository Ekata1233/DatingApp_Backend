/*
  Warnings:

  - You are about to drop the column `siblingMaritalId` on the `user_family_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `siblingOccupationId` on the `user_family_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `siblingRelationId` on the `user_family_profiles` table. All the data in the column will be lost.
  - The `media_type` column on the `user_photos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterEnum
ALTER TYPE "BoostTransactionType" ADD VALUE 'PACKAGE_CREDIT';

-- DropForeignKey
ALTER TABLE "user_family_profiles" DROP CONSTRAINT "user_family_profiles_siblingMaritalId_fkey";

-- DropForeignKey
ALTER TABLE "user_family_profiles" DROP CONSTRAINT "user_family_profiles_siblingOccupationId_fkey";

-- DropForeignKey
ALTER TABLE "user_family_profiles" DROP CONSTRAINT "user_family_profiles_siblingRelationId_fkey";

-- AlterTable
ALTER TABLE "user_family_profiles" DROP COLUMN "siblingMaritalId",
DROP COLUMN "siblingOccupationId",
DROP COLUMN "siblingRelationId";

-- AlterTable
ALTER TABLE "user_photos" DROP COLUMN "media_type",
ADD COLUMN     "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE';

-- CreateTable
CREATE TABLE "user_siblings" (
    "id" UUID NOT NULL,
    "familyProfileId" UUID NOT NULL,
    "relationId" INTEGER,
    "occupationId" INTEGER,
    "maritalId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_siblings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "user_family_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_maritalId_fkey" FOREIGN KEY ("maritalId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;
