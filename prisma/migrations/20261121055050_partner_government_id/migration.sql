-- CreateEnum
CREATE TYPE "PartnerGovernmentIdAttemptStatus" AS ENUM ('INITIATING', 'PENDING', 'AUTHORIZED', 'VERIFIED', 'REJECTED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "partner_government_id_attempts" (
    "id" UUID NOT NULL,
    "partnerId" UUID NOT NULL,
    "businessId" UUID NOT NULL,
    "referenceId" TEXT NOT NULL,
    "transactionId" TEXT,
    "providerRequestId" TEXT,
    "callbackStateHash" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'AADHAAR',
    "status" "PartnerGovernmentIdAttemptStatus" NOT NULL DEFAULT 'INITIATING',
    "consentGivenAt" TIMESTAMP(3) NOT NULL,
    "authorizedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_government_id_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "partner_government_id_attempts_referenceId_key" ON "partner_government_id_attempts"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_government_id_attempts_transactionId_key" ON "partner_government_id_attempts"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_government_id_attempts_callbackStateHash_key" ON "partner_government_id_attempts"("callbackStateHash");

-- CreateIndex
CREATE INDEX "partner_government_id_attempts_partnerId_businessId_status_idx" ON "partner_government_id_attempts"("partnerId", "businessId", "status");
