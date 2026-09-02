/*
  Warnings:

  - The values [WHEN,TIME,DURATION] on the enum `OptionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `durationId` on the `DatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `timeId` on the `DatePlan` table. All the data in the column will be lost.
  - You are about to drop the column `whenId` on the `DatePlan` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OptionType_new" AS ENUM ('ACTIVITY', 'QUICK_TITLE', 'VIBE', 'WHO_PAYS', 'JOIN_REQUEST_GENDER', 'PLAN_VISIBILITY');
ALTER TABLE "DatePlanOption" ALTER COLUMN "type" TYPE "OptionType_new" USING ("type"::text::"OptionType_new");
ALTER TYPE "OptionType" RENAME TO "OptionType_old";
ALTER TYPE "OptionType_new" RENAME TO "OptionType";
DROP TYPE "OptionType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_durationId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_timeId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_whenId_fkey";

-- AlterTable
ALTER TABLE "DatePlan" DROP COLUMN "durationId",
DROP COLUMN "timeId",
DROP COLUMN "whenId",
ADD COLUMN     "duration" INTEGER;
