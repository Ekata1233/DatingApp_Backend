/*
  Warnings:

  - The `interested_in` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `sexual_orientation` column on the `user_profiles` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'EVERYONE';

-- AlterTable
ALTER TABLE "user_profiles" DROP COLUMN "interested_in",
ADD COLUMN     "interested_in" "Gender",
DROP COLUMN "sexual_orientation",
ADD COLUMN     "sexual_orientation" "GenderOption";

-- CreateIndex
CREATE INDEX "user_profiles_interested_in_idx" ON "user_profiles"("interested_in");

-- CreateIndex
CREATE INDEX "user_profiles_sexual_orientation_idx" ON "user_profiles"("sexual_orientation");
