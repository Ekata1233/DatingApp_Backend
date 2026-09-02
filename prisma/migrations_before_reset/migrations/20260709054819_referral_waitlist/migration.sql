/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `package` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `name` on the `package` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('PREMIUM', 'VIP', 'VIP_ELITE');

-- AlterTable
ALTER TABLE "package" DROP COLUMN "name",
ADD COLUMN     "name" "PackageType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "package_name_key" ON "package"("name");
