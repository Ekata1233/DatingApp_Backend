-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('ACTIVE', 'FREQUENT', 'RELAXED', 'BUSY', 'NAPPING');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "active_days_7" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "activity_status" "ActivityStatus",
ADD COLUMN     "show_activity" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserActivityDay" (
    "userId" UUID NOT NULL,
    "dayIst" DATE NOT NULL,

    CONSTRAINT "UserActivityDay_pkey" PRIMARY KEY ("userId","dayIst")
);

-- CreateTable
CREATE TABLE "ActivityReplyRate" (
    "id" UUID NOT NULL,
    "tag" "ActivityStatus" NOT NULL,
    "week" DATE NOT NULL,
    "received" INTEGER NOT NULL DEFAULT 0,
    "replied" INTEGER NOT NULL DEFAULT 0,
    "pct" INTEGER,

    CONSTRAINT "ActivityReplyRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityWatch" (
    "watcherId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityWatch_pkey" PRIMARY KEY ("watcherId","targetId")
);

-- CreateIndex
CREATE INDEX "UserActivityDay_dayIst_idx" ON "UserActivityDay"("dayIst");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityReplyRate_tag_week_key" ON "ActivityReplyRate"("tag", "week");

-- CreateIndex
CREATE INDEX "ActivityWatch_targetId_idx" ON "ActivityWatch"("targetId");

-- AddForeignKey
ALTER TABLE "UserActivityDay" ADD CONSTRAINT "UserActivityDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityWatch" ADD CONSTRAINT "ActivityWatch_watcherId_fkey" FOREIGN KEY ("watcherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityWatch" ADD CONSTRAINT "ActivityWatch_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
