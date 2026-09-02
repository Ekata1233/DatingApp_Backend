/*
  Warnings:

  - You are about to drop the column `packageId` on the `UserSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `packageOptionId` on the `UserSubscription` table. All the data in the column will be lost.
  - The `boostOptionId` column on the `UserSubscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `boost_options` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `boosts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `userId` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `payment_id` on the `Payment` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `timePerBoost` to the `boost_options` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `boost_options` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `boost_id` on the `boost_options` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `boosts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('VIEW', 'LIKE', 'INTEREST', 'REACH');

-- DropForeignKey
ALTER TABLE "UserSubscription" DROP CONSTRAINT "UserSubscription_boostOptionId_fkey";

-- DropForeignKey
ALTER TABLE "boost_options" DROP CONSTRAINT "boost_options_boost_id_fkey";

-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "payment_id",
ADD COLUMN     "payment_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "UserSubscription" DROP COLUMN "packageId",
DROP COLUMN "packageOptionId",
DROP COLUMN "boostOptionId",
ADD COLUMN     "boostOptionId" UUID;

-- AlterTable
ALTER TABLE "boost_options" DROP CONSTRAINT "boost_options_pkey",
ADD COLUMN     "timePerBoost" INTEGER NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "boost_id",
ADD COLUMN     "boost_id" UUID NOT NULL,
ADD CONSTRAINT "boost_options_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "boosts" DROP CONSTRAINT "boosts_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "boosts_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "user_boosts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "boost_id" UUID NOT NULL,
    "boost_option_id" UUID NOT NULL,
    "total_boosts" INTEGER NOT NULL,
    "remaining_boosts" INTEGER NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_usages" (
    "id" UUID NOT NULL,
    "user_boost_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "duration" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_interests" INTEGER NOT NULL DEFAULT 0,
    "total_reach" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_boost_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_interests" INTEGER NOT NULL DEFAULT 0,
    "total_reach" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_boost_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_events" (
    "id" UUID NOT NULL,
    "boost_usage_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "event_type" "EventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_boosts_user_id_idx" ON "user_boosts"("user_id");

-- CreateIndex
CREATE INDEX "user_boosts_boost_id_idx" ON "user_boosts"("boost_id");

-- CreateIndex
CREATE INDEX "boost_usages_user_id_idx" ON "boost_usages"("user_id");

-- CreateIndex
CREATE INDEX "boost_usages_user_boost_id_idx" ON "boost_usages"("user_boost_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_boost_stats_user_id_key" ON "user_boost_stats"("user_id");

-- CreateIndex
CREATE INDEX "boost_events_boost_usage_id_idx" ON "boost_events"("boost_usage_id");

-- CreateIndex
CREATE INDEX "boost_events_user_id_idx" ON "boost_events"("user_id");

-- CreateIndex
CREATE INDEX "boost_events_actor_id_idx" ON "boost_events"("actor_id");

-- CreateIndex
CREATE INDEX "boost_options_boost_id_idx" ON "boost_options"("boost_id");

-- AddForeignKey
ALTER TABLE "boost_options" ADD CONSTRAINT "boost_options_boost_id_fkey" FOREIGN KEY ("boost_id") REFERENCES "boosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boost_id_fkey" FOREIGN KEY ("boost_id") REFERENCES "boosts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boost_option_id_fkey" FOREIGN KEY ("boost_option_id") REFERENCES "boost_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_usages" ADD CONSTRAINT "boost_usages_user_boost_id_fkey" FOREIGN KEY ("user_boost_id") REFERENCES "user_boosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_usages" ADD CONSTRAINT "boost_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boost_stats" ADD CONSTRAINT "user_boost_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_boost_usage_id_fkey" FOREIGN KEY ("boost_usage_id") REFERENCES "boost_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_boostOptionId_fkey" FOREIGN KEY ("boostOptionId") REFERENCES "boost_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
