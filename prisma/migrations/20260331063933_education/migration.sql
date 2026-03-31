/*
  Warnings:

  - The `highestEdu` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `workingAs` column on the `user_edu_work` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "user_edu_work" DROP COLUMN "highestEdu",
ADD COLUMN     "highestEdu" VARCHAR(100),
DROP COLUMN "workingAs",
ADD COLUMN     "workingAs" VARCHAR(100);

-- DropEnum
DROP TYPE "EducationType";

-- DropEnum
DROP TYPE "WorkingAs";

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_incomeRange_workingWith_idx" ON "user_edu_work"("highestEdu", "incomeRange", "workingWith");
