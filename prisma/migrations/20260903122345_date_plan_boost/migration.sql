-- CreateEnum
CREATE TYPE "DatePlanUserBoostStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "DatePlanRequest" ADD COLUMN     "billSuggestionId" UUID;

-- CreateTable
CREATE TABLE "DatePlanUserBoost" (
    "id" UUID NOT NULL,
    "datePlanId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "boostOptionId" UUID NOT NULL,
    "status" "DatePlanUserBoostStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "approvedRequestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanUserBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanBoost" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanBoost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanBoostOption" (
    "id" UUID NOT NULL,
    "boostId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "durationHours" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanBoostOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_datePlanId_idx" ON "DatePlanUserBoost"("datePlanId");

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_userId_idx" ON "DatePlanUserBoost"("userId");

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_boostOptionId_idx" ON "DatePlanUserBoost"("boostOptionId");

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_status_idx" ON "DatePlanUserBoost"("status");

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_expiresAt_idx" ON "DatePlanUserBoost"("expiresAt");

-- CreateIndex
CREATE INDEX "DatePlanUserBoost_datePlanId_status_idx" ON "DatePlanUserBoost"("datePlanId", "status");

-- CreateIndex
CREATE INDEX "DatePlanBoostOption_boostId_idx" ON "DatePlanBoostOption"("boostId");

-- CreateIndex
CREATE INDEX "DatePlanBoostOption_sortOrder_idx" ON "DatePlanBoostOption"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanBoostOption_boostId_durationHours_key" ON "DatePlanBoostOption"("boostId", "durationHours");

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_billSuggestionId_fkey" FOREIGN KEY ("billSuggestionId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanUserBoost" ADD CONSTRAINT "DatePlanUserBoost_datePlanId_fkey" FOREIGN KEY ("datePlanId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanUserBoost" ADD CONSTRAINT "DatePlanUserBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanUserBoost" ADD CONSTRAINT "DatePlanUserBoost_boostOptionId_fkey" FOREIGN KEY ("boostOptionId") REFERENCES "DatePlanBoostOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanBoostOption" ADD CONSTRAINT "DatePlanBoostOption_boostId_fkey" FOREIGN KEY ("boostId") REFERENCES "DatePlanBoost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
