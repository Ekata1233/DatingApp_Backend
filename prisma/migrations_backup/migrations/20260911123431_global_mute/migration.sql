-- DropIndex
DROP INDEX "DateConfirmed_planId_key";

-- AlterTable
ALTER TABLE "UserNotificationSetting" ADD COLUMN     "eventsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "likesRosesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "messagesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "newMatchesEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "promotionsEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "UserNotificationMute" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mutedUserId" UUID NOT NULL,
    "isMuted" BOOLEAN NOT NULL DEFAULT true,
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationMute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserNotificationMute_mutedUserId_idx" ON "UserNotificationMute"("mutedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationMute_userId_mutedUserId_key" ON "UserNotificationMute"("userId", "mutedUserId");

-- AddForeignKey
ALTER TABLE "UserNotificationMute" ADD CONSTRAINT "UserNotificationMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserNotificationMute" ADD CONSTRAINT "UserNotificationMute_mutedUserId_fkey" FOREIGN KEY ("mutedUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
