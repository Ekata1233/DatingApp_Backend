-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('YES', 'NO', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "NumberOfChildren" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE_PLUS');

-- CreateEnum
CREATE TYPE "ChildLivingArrangement" AS ENUM ('YES', 'NO', 'SOMETIME');

-- CreateEnum
CREATE TYPE "LivingSituation" AS ENUM ('OWN_HOME', 'LIVING_ALONE', 'WITH_CHILDREN', 'WITH_FAMILY', 'RENTED_HOME', 'SENIOR_LIVING_COMMUNITY', 'OTHER');

-- AlterTable
ALTER TABLE "user_profiles" ADD COLUMN     "city" VARCHAR(30),
ADD COLUMN     "country" VARCHAR(30),
ADD COLUMN     "state" VARCHAR(30);

-- CreateTable
CREATE TABLE "user_about" (
    "user_id" UUID NOT NULL,
    "maritalStatus" "MaritalStatus",
    "childStatus" "ChildStatus",
    "numberOfChildren" "NumberOfChildren",
    "childLivingArrangement" "ChildLivingArrangement",
    "livingSituation" "LivingSituation",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_about_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "user_about_maritalStatus_idx" ON "user_about"("maritalStatus");

-- CreateIndex
CREATE INDEX "user_about_childStatus_idx" ON "user_about"("childStatus");

-- CreateIndex
CREATE INDEX "user_profiles_country_idx" ON "user_profiles"("country");

-- CreateIndex
CREATE INDEX "user_profiles_state_idx" ON "user_profiles"("state");

-- CreateIndex
CREATE INDEX "user_profiles_city_idx" ON "user_profiles"("city");

-- AddForeignKey
ALTER TABLE "user_about" ADD CONSTRAINT "user_about_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
