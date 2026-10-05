-- CreateEnum
CREATE TYPE "RelationshipTag" AS ENUM ('IN_RELATIONSHIP', 'OPEN_RELATIONSHIP', 'ENGAGED', 'DATE_TO_MARRY');

-- CreateEnum
CREATE TYPE "RelationshipTagProposalStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRelationshipStatus" AS ENUM ('ACTIVE', 'ENDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "MessageType" ADD VALUE 'RELATIONSHIP_TAG_PROPOSAL';
ALTER TYPE "MessageType" ADD VALUE 'RELATIONSHIP_TAG_ACCEPTED';
ALTER TYPE "MessageType" ADD VALUE 'RELATIONSHIP_TAG_REJECTED';
ALTER TYPE "MessageType" ADD VALUE 'RELATIONSHIP_TAG_CANCELLED';

-- CreateTable
CREATE TABLE "relationship_tag_proposals" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "tag" "RelationshipTag" NOT NULL,
    "status" "RelationshipTagProposalStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "relationship_tag_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_relationships" (
    "id" UUID NOT NULL,
    "user1Id" UUID NOT NULL,
    "user2Id" UUID NOT NULL,
    "tag" "RelationshipTag" NOT NULL,
    "status" "UserRelationshipStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "proposalId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "relationship_tag_proposals_senderId_status_idx" ON "relationship_tag_proposals"("senderId", "status");

-- CreateIndex
CREATE INDEX "relationship_tag_proposals_receiverId_status_idx" ON "relationship_tag_proposals"("receiverId", "status");

-- CreateIndex
CREATE INDEX "relationship_tag_proposals_receiverId_createdAt_idx" ON "relationship_tag_proposals"("receiverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_proposalId_key" ON "user_relationships"("proposalId");

-- CreateIndex
CREATE INDEX "user_relationships_user1Id_status_idx" ON "user_relationships"("user1Id", "status");

-- CreateIndex
CREATE INDEX "user_relationships_user2Id_status_idx" ON "user_relationships"("user2Id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "user_relationships_user1Id_user2Id_key" ON "user_relationships"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "relationship_tag_proposals" ADD CONSTRAINT "relationship_tag_proposals_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_tag_proposals" ADD CONSTRAINT "relationship_tag_proposals_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_relationships" ADD CONSTRAINT "user_relationships_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "relationship_tag_proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
