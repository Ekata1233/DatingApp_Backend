-- CreateEnum
CREATE TYPE "CallbackStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'RESOLVED', 'MISSED', 'CANCELLED');

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "unmatch_note" TEXT,
ADD COLUMN     "unmatch_reason" TEXT,
ADD COLUMN     "unmatched_at" TIMESTAMP(3),
ADD COLUMN     "unmatched_by" UUID;

-- CreateTable
CREATE TABLE "CallbackRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "callbackNumber" VARCHAR(20) NOT NULL,
    "callbackDate" DATE NOT NULL,
    "timeWindow" VARCHAR(50) NOT NULL,
    "topic" VARCHAR(100),
    "status" "CallbackStatus" NOT NULL DEFAULT 'REQUESTED',
    "agentName" VARCHAR(100),
    "callDuration" INTEGER,
    "resolutionNote" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "missedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CallbackRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportFaq" (
    "id" UUID NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "answer" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportFaq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CallbackRequest_callbackNumber_key" ON "CallbackRequest"("callbackNumber");

-- CreateIndex
CREATE INDEX "CallbackRequest_userId_createdAt_idx" ON "CallbackRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CallbackRequest_userId_status_idx" ON "CallbackRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "CallbackRequest_callbackDate_status_idx" ON "CallbackRequest"("callbackDate", "status");

-- CreateIndex
CREATE INDEX "SupportFaq_isActive_sortOrder_idx" ON "SupportFaq"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "CallbackRequest" ADD CONSTRAINT "CallbackRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
