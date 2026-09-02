-- AlterTable
ALTER TABLE "users" ADD COLUMN     "badge_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "device_token" TEXT;
