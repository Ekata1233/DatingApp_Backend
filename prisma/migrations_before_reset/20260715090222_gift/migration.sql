/*
  Warnings:

  - You are about to drop the column `purchasedUsers` on the `UserReferralStats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserReferralStats" DROP COLUMN "purchasedUsers",
ADD COLUMN     "rewardedUsers" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "gift_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coinCost" INTEGER NOT NULL,
    "triggerLine" VARCHAR(90),
    "receiverLine" VARCHAR(90),
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_name_key" ON "gift_categories"("name");

-- CreateIndex
CREATE INDEX "gifts_categoryId_idx" ON "gifts"("categoryId");

-- CreateIndex
CREATE INDEX "gifts_name_idx" ON "gifts"("name");

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "gift_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
