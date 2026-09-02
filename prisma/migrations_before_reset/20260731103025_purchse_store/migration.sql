/*
  Warnings:

  - The values [SEND] on the enum `ComplimentTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [SEND] on the enum `RoseTransactionType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `UserRose` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ComplimentTransactionType_new" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'PACKAGE_SEND', 'PURCHASE_SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');
ALTER TABLE "ComplimentTransaction" ALTER COLUMN "type" TYPE "ComplimentTransactionType_new" USING ("type"::text::"ComplimentTransactionType_new");
ALTER TYPE "ComplimentTransactionType" RENAME TO "ComplimentTransactionType_old";
ALTER TYPE "ComplimentTransactionType_new" RENAME TO "ComplimentTransactionType";
DROP TYPE "ComplimentTransactionType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoseTransactionType_new" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'PACKAGE_SEND', 'PURCHASE_SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');
ALTER TABLE "RoseTransaction" ALTER COLUMN "type" TYPE "RoseTransactionType_new" USING ("type"::text::"RoseTransactionType_new");
ALTER TYPE "RoseTransactionType" RENAME TO "RoseTransactionType_old";
ALTER TYPE "RoseTransactionType_new" RENAME TO "RoseTransactionType";
DROP TYPE "RoseTransactionType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "TransactionSource" ADD VALUE 'GIFT_PURCHASE';

-- AlterTable
ALTER TABLE "UserRose" DROP COLUMN "type";

-- DropEnum
DROP TYPE "RoseType";
