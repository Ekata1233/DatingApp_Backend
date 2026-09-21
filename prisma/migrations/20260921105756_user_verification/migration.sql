-- CreateEnum
CREATE TYPE "VerificationType" AS ENUM ('GOVERNMENT_ID', 'FACE_VERIFICATION', 'VIDEO_VERIFICATION', 'EDUCATION_VERIFICATION', 'PROFESSIONAL_VERIFICATION', 'CRIMINAL_BACKGROUND_CHECK', 'EMERGENCY_CONTACT', 'INCOME_VERIFICATION');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'VERIFIED', 'REJECTED', 'EXPIRED', 'LOCKED');

-- CreateEnum
CREATE TYPE "GovernmentIdType" AS ENUM ('AADHAAR', 'PAN', 'DRIVING_LICENSE');

-- CreateEnum
CREATE TYPE "GovernmentIdAttemptStatus" AS ENUM ('INITIATING', 'PENDING', 'AUTHORIZED', 'DENIED', 'VERIFIED', 'FAILED', 'EXPIRED');

-- CreateTable
CREATE TABLE "user_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "VerificationType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "points" INTEGER NOT NULL DEFAULT 0,
    "maxPoints" INTEGER NOT NULL,
    "governmentIdType" "GovernmentIdType",
    "startedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "provider" TEXT,
    "providerRef" TEXT,
    "rejectionReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "government_id_attempts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "documentType" "GovernmentIdType" NOT NULL,
    "status" "GovernmentIdAttemptStatus" NOT NULL DEFAULT 'INITIATING',
    "transactionId" TEXT,
    "referenceId" TEXT NOT NULL,
    "callbackStateHash" TEXT NOT NULL,
    "providerRequestId" TEXT,
    "consentGivenAt" TIMESTAMP(3) NOT NULL,
    "authorizedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "government_id_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_verifications_userId_idx" ON "user_verifications"("userId");

-- CreateIndex
CREATE INDEX "user_verifications_type_idx" ON "user_verifications"("type");

-- CreateIndex
CREATE INDEX "user_verifications_status_idx" ON "user_verifications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_userId_type_key" ON "user_verifications"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "government_id_attempts_transactionId_key" ON "government_id_attempts"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "government_id_attempts_referenceId_key" ON "government_id_attempts"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "government_id_attempts_callbackStateHash_key" ON "government_id_attempts"("callbackStateHash");

-- CreateIndex
CREATE INDEX "government_id_attempts_userId_createdAt_idx" ON "government_id_attempts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "government_id_attempts_verificationId_status_idx" ON "government_id_attempts"("verificationId", "status");

-- AddForeignKey
ALTER TABLE "user_verifications" ADD CONSTRAINT "user_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_id_attempts" ADD CONSTRAINT "government_id_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "government_id_attempts" ADD CONSTRAINT "government_id_attempts_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
