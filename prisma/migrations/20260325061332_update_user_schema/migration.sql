/*
  Warnings:

  - You are about to drop the column `birth_date` on the `user_profiles` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `user_profiles` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_profiles_birth_date_idx";

-- DropIndex
DROP INDEX "user_profiles_gender_idx";

-- DropIndex
DROP INDEX "user_profiles_gender_interested_in_idx";

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "birth_date",
DROP COLUMN "gender";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birth_date" DATE,
ADD COLUMN     "gender" VARCHAR(20),
ADD COLUMN     "height" INTEGER;

-- CreateIndex
CREATE INDEX "users_gender_created_at_idx" ON "users"("gender", "created_at");
