-- AlterTable
ALTER TABLE "DatePlan" ADD COLUMN     "quickTitleId" UUID;

-- CreateTable
CREATE TABLE "DatePlanSkip" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatePlanSkip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatePlanSkip_userId_idx" ON "DatePlanSkip"("userId");

-- CreateIndex
CREATE INDEX "DatePlanSkip_planId_idx" ON "DatePlanSkip"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanSkip_userId_planId_key" ON "DatePlanSkip"("userId", "planId");

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_quickTitleId_fkey" FOREIGN KEY ("quickTitleId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanSkip" ADD CONSTRAINT "DatePlanSkip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanSkip" ADD CONSTRAINT "DatePlanSkip_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
