-- CreateTable
CREATE TABLE "UserCompatibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserCompatibility_userId_score_idx" ON "UserCompatibility"("userId", "score");

-- CreateIndex
CREATE INDEX "UserCompatibility_userId_targetUserId_idx" ON "UserCompatibility"("userId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompatibility_userId_targetUserId_key" ON "UserCompatibility"("userId", "targetUserId");
