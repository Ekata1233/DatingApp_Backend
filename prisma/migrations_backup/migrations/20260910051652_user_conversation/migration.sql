-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'LINK';

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "match" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "matchPendingForUserId" UUID;

-- CreateTable
CREATE TABLE "EventCancelFAQ" (
    "id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCancelFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Conversation_matchPendingForUserId_idx" ON "Conversation"("matchPendingForUserId");

-- CreateIndex
CREATE INDEX "Conversation_match_idx" ON "Conversation"("match");
