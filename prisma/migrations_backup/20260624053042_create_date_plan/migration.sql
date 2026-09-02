/*
  Warnings:

  - The values [PARTICIPANTS] on the enum `OptionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OptionType_new" AS ENUM ('ACTIVITY', 'QUICK_TITLE', 'VIBE', 'WHEN', 'TIME', 'DURATION', 'WHO_PAYS', 'JOIN_REQUEST_GENDER', 'PLAN_VISIBILITY');
ALTER TABLE "DatePlanOption" ALTER COLUMN "type" TYPE "OptionType_new" USING ("type"::text::"OptionType_new");
ALTER TYPE "OptionType" RENAME TO "OptionType_old";
ALTER TYPE "OptionType_new" RENAME TO "OptionType";
DROP TYPE "OptionType_old";
COMMIT;
