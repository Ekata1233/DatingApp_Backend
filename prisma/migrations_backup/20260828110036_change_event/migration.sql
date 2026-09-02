/*
  Warnings:

  - You are about to drop the column `officialPartner` on the `Event` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "EventTag" AS ENUM ('BRAND', 'PROMOTED', 'FEATURED');

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "officialPartner",
ADD COLUMN     "eventTag" "EventTag";
