/*
  Warnings:

  - Added the required column `expected_end_at` to the `boost_usages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `boost_usages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "BoostDemographicType" AS ENUM ('LOCATION', 'PROFESSION', 'RELIGION', 'COMMUNITY', 'AGE_GROUP', 'VERIFIED', 'GENDER');

-- CreateEnum
CREATE TYPE "BoostUsageStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BoostEventType" AS ENUM ('IMPRESSION', 'PROFILE_VIEW', 'LIKE', 'SUPERLIKE', 'INTEREST', 'MATCH', 'PASS');

-- AlterTable
ALTER TABLE "boost_usages" ADD COLUMN     "baseline_interests" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "baseline_likes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "baseline_reach" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "baseline_views" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "boost_id" UUID,
ADD COLUMN     "boost_type" "BoostType",
ADD COLUMN     "display_name" TEXT,
ADD COLUMN     "expected_end_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "BoostUsageStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "total_impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_matches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_superlikes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "boosts" ADD COLUMN     "benefits" JSONB;

-- AlterTable
ALTER TABLE "user_boost_stats" ADD COLUMN     "last_boost_at" TIMESTAMP(3),
ADD COLUMN     "total_boost_minutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_boosts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_matches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "total_superlikes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "account_status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "pause_reason" VARCHAR(255),
ADD COLUMN     "paused_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "boost_hourly_stats" (
    "id" UUID NOT NULL,
    "boost_usage_id" UUID NOT NULL,
    "hour" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "superlikes" INTEGER NOT NULL DEFAULT 0,
    "interests" INTEGER NOT NULL DEFAULT 0,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "baseline_impressions" INTEGER NOT NULL DEFAULT 0,
    "baseline_reach" INTEGER NOT NULL DEFAULT 0,
    "baseline_views" INTEGER NOT NULL DEFAULT 0,
    "baseline_likes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_hourly_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_demographic_stats" (
    "id" UUID NOT NULL,
    "boost_usage_id" UUID NOT NULL,
    "type" "BoostDemographicType" NOT NULL,
    "label" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_demographic_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_reach_users" (
    "id" UUID NOT NULL,
    "boost_usage_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "impression_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "boost_reach_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boost_hourly_stats_boost_usage_id_idx" ON "boost_hourly_stats"("boost_usage_id");

-- CreateIndex
CREATE INDEX "boost_hourly_stats_boost_usage_id_hour_idx" ON "boost_hourly_stats"("boost_usage_id", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "boost_hourly_stats_boost_usage_id_hour_key" ON "boost_hourly_stats"("boost_usage_id", "hour");

-- CreateIndex
CREATE INDEX "boost_demographic_stats_boost_usage_id_type_idx" ON "boost_demographic_stats"("boost_usage_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "boost_demographic_stats_boost_usage_id_type_label_key" ON "boost_demographic_stats"("boost_usage_id", "type", "label");

-- CreateIndex
CREATE INDEX "boost_reach_users_boost_usage_id_idx" ON "boost_reach_users"("boost_usage_id");

-- CreateIndex
CREATE INDEX "boost_reach_users_actor_id_idx" ON "boost_reach_users"("actor_id");

-- CreateIndex
CREATE UNIQUE INDEX "boost_reach_users_boost_usage_id_actor_id_key" ON "boost_reach_users"("boost_usage_id", "actor_id");

-- CreateIndex
CREATE INDEX "boost_usages_boost_id_idx" ON "boost_usages"("boost_id");

-- CreateIndex
CREATE INDEX "boost_usages_user_id_status_idx" ON "boost_usages"("user_id", "status");

-- CreateIndex
CREATE INDEX "boost_usages_user_id_started_at_idx" ON "boost_usages"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "boost_usages_status_expected_end_at_idx" ON "boost_usages"("status", "expected_end_at");

-- CreateIndex
CREATE INDEX "users_account_status_idx" ON "users"("account_status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- AddForeignKey
ALTER TABLE "boost_usages" ADD CONSTRAINT "boost_usages_boost_id_fkey" FOREIGN KEY ("boost_id") REFERENCES "boosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_hourly_stats" ADD CONSTRAINT "boost_hourly_stats_boost_usage_id_fkey" FOREIGN KEY ("boost_usage_id") REFERENCES "boost_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_demographic_stats" ADD CONSTRAINT "boost_demographic_stats_boost_usage_id_fkey" FOREIGN KEY ("boost_usage_id") REFERENCES "boost_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_reach_users" ADD CONSTRAINT "boost_reach_users_boost_usage_id_fkey" FOREIGN KEY ("boost_usage_id") REFERENCES "boost_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_reach_users" ADD CONSTRAINT "boost_reach_users_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
