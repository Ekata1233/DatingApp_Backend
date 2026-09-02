-- CreateEnum
CREATE TYPE "DatePlanAttendanceStatus" AS ENUM ('MET', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DatePlanFeedbackStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "DatePlanNoShowReason" AS ENUM ('TIMING_WAS_OFF', 'VENUE_TOO_FAR', 'SHORT_NOTICE', 'APPROVED_TOO_LATE', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "DatePlanExperienceTag" AS ENUM ('RESPECTFUL', 'GREAT_CONVERSATION', 'ON_TIME', 'GENUINE', 'FUN', 'WOULD_MEET_AGAIN');

-- AlterTable
ALTER TABLE "ConversationParticipant" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DatePlanFeedback" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "attendanceStatus" "DatePlanAttendanceStatus" NOT NULL,
    "metUserId" UUID,
    "overallRating" INTEGER,
    "personRating" INTEGER,
    "noShowReason" "DatePlanNoShowReason",
    "comment" TEXT,
    "status" "DatePlanFeedbackStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanFeedbackTag" (
    "id" UUID NOT NULL,
    "feedbackId" UUID NOT NULL,
    "tag" "DatePlanExperienceTag" NOT NULL,

    CONSTRAINT "DatePlanFeedbackTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessageDeletion" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessageDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatePlanFeedback_planId_idx" ON "DatePlanFeedback"("planId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_reviewerId_idx" ON "DatePlanFeedback"("reviewerId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_metUserId_idx" ON "DatePlanFeedback"("metUserId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_attendanceStatus_idx" ON "DatePlanFeedback"("attendanceStatus");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_createdAt_idx" ON "DatePlanFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanFeedback_planId_reviewerId_key" ON "DatePlanFeedback"("planId", "reviewerId");

-- CreateIndex
CREATE INDEX "DatePlanFeedbackTag_tag_idx" ON "DatePlanFeedbackTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanFeedbackTag_feedbackId_tag_key" ON "DatePlanFeedbackTag"("feedbackId", "tag");

-- CreateIndex
CREATE INDEX "ChatMessageDeletion_userId_idx" ON "ChatMessageDeletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageDeletion_messageId_userId_key" ON "ChatMessageDeletion"("messageId", "userId");

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_metUserId_fkey" FOREIGN KEY ("metUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedbackTag" ADD CONSTRAINT "DatePlanFeedbackTag_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "DatePlanFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageDeletion" ADD CONSTRAINT "ChatMessageDeletion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageDeletion" ADD CONSTRAINT "ChatMessageDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
