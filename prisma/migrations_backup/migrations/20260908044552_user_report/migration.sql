/*
  Warnings:

  - Added the required column `reason` to the `UserReport` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserReport` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `reporterId` on the `UserReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `reportedId` on the `UserReport` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ReportAction" AS ENUM ('NONE', 'WARNING', 'CONTENT_REMOVED', 'ACCOUNT_RESTRICTED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED');

-- AlterTable
ALTER TABLE "UserReport" ADD COLUMN     "actionTaken" "ReportAction" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "description" VARCHAR(300),
ADD COLUMN     "reason" VARCHAR(100) NOT NULL,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" UUID,
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "reporterId",
ADD COLUMN     "reporterId" UUID NOT NULL,
DROP COLUMN "reportedId",
ADD COLUMN     "reportedId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "UserReport_reportedId_idx" ON "UserReport"("reportedId");

-- CreateIndex
CREATE INDEX "UserReport_reporterId_idx" ON "UserReport"("reporterId");

-- CreateIndex
CREATE INDEX "UserReport_status_idx" ON "UserReport"("status");

-- CreateIndex
CREATE INDEX "UserReport_reason_idx" ON "UserReport"("reason");

-- CreateIndex
CREATE INDEX "UserReport_createdAt_idx" ON "UserReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_reporterId_reportedId_key" ON "UserReport"("reporterId", "reportedId");

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReport" ADD CONSTRAINT "UserReport_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
