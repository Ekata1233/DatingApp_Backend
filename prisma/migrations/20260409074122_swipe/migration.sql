-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'PASS', 'SUPERLIKE');

-- CreateTable
CREATE TABLE "swipes" (
    "id" UUID NOT NULL,
    "swiperId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "isMutual" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "swipes_swiperId_idx" ON "swipes"("swiperId");

-- CreateIndex
CREATE INDEX "swipes_targetUserId_idx" ON "swipes"("targetUserId");

-- CreateIndex
CREATE INDEX "swipes_action_idx" ON "swipes"("action");

-- CreateIndex
CREATE INDEX "swipes_created_at_idx" ON "swipes"("created_at");

-- CreateIndex
CREATE INDEX "swipes_swiperId_action_idx" ON "swipes"("swiperId", "action");

-- CreateIndex
CREATE INDEX "swipes_targetUserId_action_idx" ON "swipes"("targetUserId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_swiperId_targetUserId_key" ON "swipes"("swiperId", "targetUserId");

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
