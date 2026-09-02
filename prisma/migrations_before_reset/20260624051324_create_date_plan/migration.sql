-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('ACTIVITY', 'QUICK_TITLE', 'VIBE', 'WHEN', 'TIME', 'DURATION', 'WHO_PAYS', 'PARTICIPANTS', 'JOIN_REQUEST_GENDER', 'PLAN_VISIBILITY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DatePlanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

-- CreateTable
CREATE TABLE "DatePlanOption" (
    "id" TEXT NOT NULL,
    "type" "OptionType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlan" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "activityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "photoUrl" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "venueLat" DOUBLE PRECISION,
    "venueLng" DOUBLE PRECISION,
    "whenId" TEXT NOT NULL,
    "timeId" TEXT NOT NULL,
    "durationId" TEXT NOT NULL,
    "whoPaysId" TEXT NOT NULL,
    "participantLimit" INTEGER NOT NULL,
    "joinRequestGenderId" TEXT NOT NULL,
    "visibilityId" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanVibe" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "vibeId" TEXT NOT NULL,

    CONSTRAINT "DatePlanVibe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanRequest" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "requesterId" UUID NOT NULL,
    "status" "DatePlanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatePlanOption_type_isActive_idx" ON "DatePlanOption"("type", "isActive");

-- CreateIndex
CREATE INDEX "DatePlan_userId_idx" ON "DatePlan"("userId");

-- CreateIndex
CREATE INDEX "DatePlan_activityId_idx" ON "DatePlan"("activityId");

-- CreateIndex
CREATE INDEX "DatePlan_status_idx" ON "DatePlan"("status");

-- CreateIndex
CREATE INDEX "DatePlan_createdAt_idx" ON "DatePlan"("createdAt");

-- CreateIndex
CREATE INDEX "DatePlanVibe_vibeId_idx" ON "DatePlanVibe"("vibeId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanVibe_planId_vibeId_key" ON "DatePlanVibe"("planId", "vibeId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_planId_idx" ON "DatePlanRequest"("planId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_requesterId_idx" ON "DatePlanRequest"("requesterId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_status_idx" ON "DatePlanRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanRequest_planId_requesterId_key" ON "DatePlanRequest"("planId", "requesterId");

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whenId_fkey" FOREIGN KEY ("whenId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_durationId_fkey" FOREIGN KEY ("durationId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whoPaysId_fkey" FOREIGN KEY ("whoPaysId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_joinRequestGenderId_fkey" FOREIGN KEY ("joinRequestGenderId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_visibilityId_fkey" FOREIGN KEY ("visibilityId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
