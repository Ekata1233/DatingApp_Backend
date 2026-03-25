/*
  Warnings:

  - You are about to drop the column `looking_for` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_profiles_looking_for_idx";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "looking_for";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "looking_for" VARCHAR(50);

-- CreateIndex
CREATE INDEX "users_looking_for_idx" ON "users"("looking_for");
