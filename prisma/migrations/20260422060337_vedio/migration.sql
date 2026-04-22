/*
  Warnings:

  - You are about to drop the column `image_url` on the `user_photos` table. All the data in the column will be lost.
  - Added the required column `media_url` to the `user_photos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LookingForOption" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'NEW_FRIENDS', 'CASUAL', 'COMPANIONSHIP', 'LIFE_PARTNER', 'TRAVEL_PARTNER', 'EMOTIONAL_SUPPORT', 'FRIENDSHIP_FIRST');

-- AlterTable
ALTER TABLE "user_photos" DROP COLUMN "image_url",
ADD COLUMN     "media_type" TEXT NOT NULL DEFAULT 'image',
ADD COLUMN     "media_url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "looking_for_option" "LookingForOption";
