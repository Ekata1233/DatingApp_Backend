/*
  Warnings:

  - The `looking_for` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('DATE_TO_MARRY', 'DATING', 'MATURE_CONNECTION');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "looking_for",
ADD COLUMN     "looking_for" "LookingFor";

-- CreateIndex
CREATE INDEX "users_looking_for_idx" ON "users"("looking_for");
