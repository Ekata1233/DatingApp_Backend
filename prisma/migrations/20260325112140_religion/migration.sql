-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "community" VARCHAR(50),
ADD COLUMN     "religion" VARCHAR(50);

-- CreateIndex
CREATE INDEX "user_profiles_religion_idx" ON "user_profiles"("religion");

-- CreateIndex
CREATE INDEX "user_profiles_community_idx" ON "user_profiles"("community");
