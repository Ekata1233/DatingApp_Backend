/*
  Warnings:

  - You are about to drop the column `relationId` on the `user_siblings` table. All the data in the column will be lost.
  - Added the required column `siblingTypeId` to the `user_siblings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "StoreFeatureType" ADD VALUE 'WHO_LIKED_YOU_REVEAL_COST';

-- DropForeignKey
ALTER TABLE "user_siblings" DROP CONSTRAINT "user_siblings_relationId_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_intentionId_fkey";

-- AlterTable
ALTER TABLE "user_siblings" DROP COLUMN "relationId",
ADD COLUMN     "siblingTypeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "store_info" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_info_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "store_info_itemType_isActive_idx" ON "store_info"("itemType", "isActive");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "IntentionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_siblingTypeId_fkey" FOREIGN KEY ("siblingTypeId") REFERENCES "master_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
