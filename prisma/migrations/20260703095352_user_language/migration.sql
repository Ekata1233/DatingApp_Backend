/*
  Warnings:

  - The primary key for the `Intention` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `optDescription` on the `Intention` table. All the data in the column will be lost.
  - You are about to drop the column `option` on the `Intention` table. All the data in the column will be lost.
  - The `intentionId` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `id` on the `Intention` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_intentionId_fkey";

-- AlterTable
ALTER TABLE "Intention" DROP CONSTRAINT "Intention_pkey",
DROP COLUMN "optDescription",
DROP COLUMN "option",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "Intention_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "users" DROP COLUMN "intentionId",
ADD COLUMN     "intentionId" UUID;

-- CreateTable
CREATE TABLE "IntentionOption" (
    "id" UUID NOT NULL,
    "option" TEXT NOT NULL,
    "optDescription" TEXT,
    "intentionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentionOption_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "Intention"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentionOption" ADD CONSTRAINT "IntentionOption_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "Intention"("id") ON DELETE CASCADE ON UPDATE CASCADE;
