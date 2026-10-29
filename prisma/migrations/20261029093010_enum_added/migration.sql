-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CONFIRM';
ALTER TYPE "NotificationType" ADD VALUE 'EVENT_CANCEL';
ALTER TYPE "NotificationType" ADD VALUE 'DATE_CANCELLED';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_TAG_PROPOSAL';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_TAG_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_TAG_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE 'RELATIONSHIP_TAG_CANCELLED';
