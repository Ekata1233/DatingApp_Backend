/*
  Warnings:

  - Added the required column `expiresAt` to the `UserGift` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('ABOUT', 'BASIC', 'VIDEO', 'PROMPT', 'PHOTO', 'CAREER', 'INTEREST', 'LIFESTYLE', 'FAMILY');

-- DropIndex
DROP INDEX "UserRose_createdAt_idx";

-- AlterTable
ALTER TABLE "UserCompliment" ADD COLUMN     "targetId" UUID,
ADD COLUMN     "targetType" "TargetType";

-- AlterTable
ALTER TABLE "UserGift" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messagesSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredMessages" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "targetId" UUID,
ADD COLUMN     "targetType" "TargetType",
ADD COLUMN     "unlockedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserRose" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "messagesSent" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "requiredMessages" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "targetId" UUID,
ADD COLUMN     "targetType" "TargetType",
ADD COLUMN     "unlockedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "UserGift_receiverId_senderId_isUnlocked_expiresAt_idx" ON "UserGift"("receiverId", "senderId", "isUnlocked", "expiresAt");

-- CreateIndex
CREATE INDEX "UserRose_receiverId_senderId_isUnlocked_expiresAt_idx" ON "UserRose"("receiverId", "senderId", "isUnlocked", "expiresAt");
