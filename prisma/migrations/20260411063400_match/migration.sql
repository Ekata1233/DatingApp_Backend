-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "user1Id" UUID NOT NULL,
    "user2Id" UUID NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_user1Id_idx" ON "matches"("user1Id");

-- CreateIndex
CREATE INDEX "matches_user2Id_idx" ON "matches"("user2Id");

-- CreateIndex
CREATE INDEX "matches_matched_at_idx" ON "matches"("matched_at");

-- CreateIndex
CREATE INDEX "matches_last_message_at_idx" ON "matches"("last_message_at");

-- CreateIndex
CREATE INDEX "matches_is_active_idx" ON "matches"("is_active");

-- CreateIndex
CREATE INDEX "matches_user1Id_is_active_idx" ON "matches"("user1Id", "is_active");

-- CreateIndex
CREATE INDEX "matches_user2Id_is_active_idx" ON "matches"("user2Id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user1Id_user2Id_key" ON "matches"("user1Id", "user2Id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
