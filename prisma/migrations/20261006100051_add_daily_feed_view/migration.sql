-- CreateEnum
CREATE TYPE "IncomeProofType" AS ENUM ('SALARY_SLIP', 'FORM_16', 'ITR', 'BANK_STATEMENT', 'EMPLOYMENT_LETTER', 'BUSINESS_INCOME_PROOF', 'OTHER');

-- CreateTable
CREATE TABLE "income_verifications" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "annualIncome" DECIMAL(15,2),
    "currency" VARCHAR(10) NOT NULL DEFAULT 'INR',
    "proofType" "IncomeProofType" NOT NULL,
    "employerName" TEXT,
    "financialYear" VARCHAR(20),
    "primaryDocumentUrl" TEXT NOT NULL,
    "secondaryDocumentUrl" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "income_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDailyFeedView" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "viewDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserDailyFeedView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "income_verifications_userId_key" ON "income_verifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "income_verifications_verificationId_key" ON "income_verifications"("verificationId");

-- CreateIndex
CREATE INDEX "income_verifications_status_idx" ON "income_verifications"("status");

-- CreateIndex
CREATE INDEX "income_verifications_proofType_idx" ON "income_verifications"("proofType");

-- CreateIndex
CREATE INDEX "UserDailyFeedView_userId_viewDate_idx" ON "UserDailyFeedView"("userId", "viewDate");

-- CreateIndex
CREATE INDEX "UserDailyFeedView_targetUserId_idx" ON "UserDailyFeedView"("targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserDailyFeedView_userId_targetUserId_viewDate_key" ON "UserDailyFeedView"("userId", "targetUserId", "viewDate");

-- AddForeignKey
ALTER TABLE "income_verifications" ADD CONSTRAINT "income_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "income_verifications" ADD CONSTRAINT "income_verifications_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyFeedView" ADD CONSTRAINT "UserDailyFeedView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDailyFeedView" ADD CONSTRAINT "UserDailyFeedView_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
