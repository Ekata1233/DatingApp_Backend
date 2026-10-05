-- CreateTable
CREATE TABLE "manual_government_id_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "documentType" "GovernmentIdType" NOT NULL,
    "documentNumber" VARCHAR(50) NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" DATE,
    "frontPhoto" TEXT NOT NULL,
    "backPhoto" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_government_id_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "manual_government_id_verifications_userId_key" ON "manual_government_id_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "manual_government_id_verifications_verificationId_key" ON "manual_government_id_verifications"("verificationId");

-- CreateIndex
CREATE INDEX "manual_government_id_verifications_status_idx" ON "manual_government_id_verifications"("status");

-- CreateIndex
CREATE INDEX "manual_government_id_verifications_documentType_idx" ON "manual_government_id_verifications"("documentType");

-- AddForeignKey
ALTER TABLE "manual_government_id_verifications" ADD CONSTRAINT "manual_government_id_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "manual_government_id_verifications" ADD CONSTRAINT "manual_government_id_verifications_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
