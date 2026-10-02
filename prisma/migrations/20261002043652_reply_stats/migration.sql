-- CreateTable
CREATE TABLE "UserReplyStats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "medianReplyMinutes" INTEGER,
    "sampleCount" INTEGER NOT NULL DEFAULT 0,
    "recentSamples" JSONB,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReplyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserReplyStats_userId_key" ON "UserReplyStats"("userId");

-- CreateIndex
CREATE INDEX "UserReplyStats_userId_idx" ON "UserReplyStats"("userId");

-- AddForeignKey
ALTER TABLE "UserReplyStats" ADD CONSTRAINT "UserReplyStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
