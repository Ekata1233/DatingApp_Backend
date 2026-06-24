/*
  Warnings:

  - The primary key for the `DatePlan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DatePlanOption` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `eventDateTime` to the `DatePlan` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `activityId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `whenId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `timeId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `durationId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `whoPaysId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `joinRequestGenderId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `visibilityId` on the `DatePlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `DatePlanOption` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `planId` on the `DatePlanRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `planId` on the `DatePlanVibe` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `vibeId` on the `DatePlanVibe` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_activityId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_durationId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_joinRequestGenderId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_timeId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_visibilityId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_whenId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_whoPaysId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlanRequest" DROP CONSTRAINT "DatePlanRequest_planId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlanVibe" DROP CONSTRAINT "DatePlanVibe_planId_fkey";

-- DropForeignKey
ALTER TABLE "DatePlanVibe" DROP CONSTRAINT "DatePlanVibe_vibeId_fkey";

-- AlterTable
ALTER TABLE "DatePlan" DROP CONSTRAINT "DatePlan_pkey",
ADD COLUMN     "eventDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "activityId",
ADD COLUMN     "activityId" UUID NOT NULL,
DROP COLUMN "whenId",
ADD COLUMN     "whenId" UUID NOT NULL,
DROP COLUMN "timeId",
ADD COLUMN     "timeId" UUID NOT NULL,
DROP COLUMN "durationId",
ADD COLUMN     "durationId" UUID NOT NULL,
DROP COLUMN "whoPaysId",
ADD COLUMN     "whoPaysId" UUID NOT NULL,
DROP COLUMN "joinRequestGenderId",
ADD COLUMN     "joinRequestGenderId" UUID NOT NULL,
DROP COLUMN "visibilityId",
ADD COLUMN     "visibilityId" UUID NOT NULL,
ADD CONSTRAINT "DatePlan_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DatePlanOption" DROP CONSTRAINT "DatePlanOption_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "DatePlanOption_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "DatePlanRequest" DROP COLUMN "planId",
ADD COLUMN     "planId" UUID NOT NULL;

-- AlterTable
ALTER TABLE "DatePlanVibe" DROP COLUMN "planId",
ADD COLUMN     "planId" UUID NOT NULL,
DROP COLUMN "vibeId",
ADD COLUMN     "vibeId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "DatePlan_activityId_idx" ON "DatePlan"("activityId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_planId_idx" ON "DatePlanRequest"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanRequest_planId_requesterId_key" ON "DatePlanRequest"("planId", "requesterId");

-- CreateIndex
CREATE INDEX "DatePlanVibe_vibeId_idx" ON "DatePlanVibe"("vibeId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanVibe_planId_vibeId_key" ON "DatePlanVibe"("planId", "vibeId");

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whenId_fkey" FOREIGN KEY ("whenId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_durationId_fkey" FOREIGN KEY ("durationId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whoPaysId_fkey" FOREIGN KEY ("whoPaysId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_joinRequestGenderId_fkey" FOREIGN KEY ("joinRequestGenderId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_visibilityId_fkey" FOREIGN KEY ("visibilityId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
