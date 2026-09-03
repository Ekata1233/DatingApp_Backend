-- CreateEnum
CREATE TYPE "LegalPageType" AS ENUM ('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COMMUNITY_GUIDELINES', 'DATING_SAFETY_TIPS', 'CHILD_SAFETY_STANDARDS', 'AGE_POLICY_18_PLUS', 'CONTENT_MODERATION_LAW_ENFORCEMENT', 'REFUND_CANCELLATION_POLICY', 'WALLET_COINS_TERMS', 'FOREVER_LOVE_PROGRAMME_TERMS', 'COOKIE_POLICY', 'DATA_YOUR_RIGHTS', 'VERIFICATION_ID_POLICY', 'DELETE_ACCOUNT_DATA', 'LICENSES_ACKNOWLEDGEMENTS', 'GRIEVANCE_OFFICER_REDRESSAL');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'CONTACT';
ALTER TYPE "MessageType" ADD VALUE 'LOCATION';

-- CreateTable
CREATE TABLE "LegalPage" (
    "id" UUID NOT NULL,
    "pageType" "LegalPageType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "content" JSONB NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "effectiveFrom" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdBy" UUID,
    "publishedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalPage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalPage_pageType_key" ON "LegalPage"("pageType");

-- CreateIndex
CREATE INDEX "LegalPage_pageType_idx" ON "LegalPage"("pageType");

-- CreateIndex
CREATE INDEX "LegalPage_publishedAt_idx" ON "LegalPage"("publishedAt");
