-- AlterTable
ALTER TABLE "user_packages" ADD COLUMN     "autoRenewCancelReason" TEXT,
ADD COLUMN     "autoRenewCancelledAt" TIMESTAMP(3);
