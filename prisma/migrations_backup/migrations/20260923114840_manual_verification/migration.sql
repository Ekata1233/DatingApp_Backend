-- CreateEnum
CREATE TYPE "EmploymentVerificationStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- AlterTable
ALTER TABLE "user_verifications" ADD COLUMN     "verifiedName" TEXT;

-- CreateTable
CREATE TABLE "EmploymentVerification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "companyName" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "isCurrentlyWorking" BOOLEAN NOT NULL DEFAULT true,
    "employmentIdUrl" TEXT NOT NULL,
    "salarySlipUrl" TEXT NOT NULL,
    "bankStatementUrl" TEXT NOT NULL,
    "status" "EmploymentVerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmploymentVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmploymentVerification_verificationId_key" ON "EmploymentVerification"("verificationId");

-- CreateIndex
CREATE INDEX "EmploymentVerification_userId_idx" ON "EmploymentVerification"("userId");

-- CreateIndex
CREATE INDEX "EmploymentVerification_verificationId_idx" ON "EmploymentVerification"("verificationId");

-- CreateIndex
CREATE INDEX "EmploymentVerification_status_idx" ON "EmploymentVerification"("status");

-- AddForeignKey
ALTER TABLE "EmploymentVerification" ADD CONSTRAINT "EmploymentVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmploymentVerification" ADD CONSTRAINT "EmploymentVerification_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "user_verifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
