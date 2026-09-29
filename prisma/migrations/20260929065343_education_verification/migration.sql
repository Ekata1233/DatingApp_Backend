-- AlterTable
ALTER TABLE "users" ADD COLUMN     "trust_score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "EducationVerification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "institutionName" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "startYear" INTEGER,
    "graduationYear" INTEGER,
    "isCurrentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT NOT NULL,
    "marksheetUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EducationVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EducationVerification_verificationId_key" ON "EducationVerification"("verificationId");

-- CreateIndex
CREATE INDEX "EducationVerification_userId_idx" ON "EducationVerification"("userId");

-- CreateIndex
CREATE INDEX "EducationVerification_status_idx" ON "EducationVerification"("status");

-- AddForeignKey
ALTER TABLE "EducationVerification" ADD CONSTRAINT "EducationVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EducationVerification" ADD CONSTRAINT "EducationVerification_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
