-- AlterTable
ALTER TABLE "government_id_attempts" ALTER COLUMN "referenceId" DROP NOT NULL,
ALTER COLUMN "callbackStateHash" DROP NOT NULL,
ALTER COLUMN "consentGivenAt" DROP NOT NULL;
