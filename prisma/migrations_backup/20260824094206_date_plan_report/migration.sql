-- CreateEnum
CREATE TYPE "DatePlanReportReason" AS ENUM ('DID_NOT_SHOW_AS_DESCRIBED', 'MADE_ME_UNCOMFORTABLE', 'INAPPROPRIATE_BEHAVIOUR', 'FAKE_PROFILE', 'SAFETY_CONCERN');

-- CreateEnum
CREATE TYPE "DatePlanReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "DatePlanReport" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reportedUserId" UUID NOT NULL,
    "reason" "DatePlanReportReason" NOT NULL,
    "comment" TEXT,
    "status" "DatePlanReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatePlanReport_planId_idx" ON "DatePlanReport"("planId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reporterId_idx" ON "DatePlanReport"("reporterId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reportedUserId_idx" ON "DatePlanReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reason_idx" ON "DatePlanReport"("reason");

-- CreateIndex
CREATE INDEX "DatePlanReport_status_idx" ON "DatePlanReport"("status");

-- CreateIndex
CREATE INDEX "DatePlanReport_createdAt_idx" ON "DatePlanReport"("createdAt");

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
