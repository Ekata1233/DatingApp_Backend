-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'GIF';

-- AlterTable
ALTER TABLE "DatePlanPackage" ADD COLUMN     "isBestValue" BOOLEAN NOT NULL DEFAULT false;
