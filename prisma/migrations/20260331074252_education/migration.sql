/*
  Warnings:

  - Added the required column `screen` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "QuestionScreen" AS ENUM ('LIFESTYLE', 'REAL_U_MATTERS', 'THINGS_U_LOVE', 'INTEREST_HOBBY', 'DREAM_PLAN');

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "screen" "QuestionScreen" NOT NULL;
