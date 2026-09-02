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

-- AlterTable
ALTER TABLE "DatePlan" ALTER COLUMN "participantLimit" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "eventDateTime" DROP NOT NULL,
ALTER COLUMN "whenId" DROP NOT NULL,
ALTER COLUMN "timeId" DROP NOT NULL,
ALTER COLUMN "durationId" DROP NOT NULL,
ALTER COLUMN "whoPaysId" DROP NOT NULL,
ALTER COLUMN "joinRequestGenderId" DROP NOT NULL,
ALTER COLUMN "visibilityId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whenId_fkey" FOREIGN KEY ("whenId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_timeId_fkey" FOREIGN KEY ("timeId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_durationId_fkey" FOREIGN KEY ("durationId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whoPaysId_fkey" FOREIGN KEY ("whoPaysId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_joinRequestGenderId_fkey" FOREIGN KEY ("joinRequestGenderId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_visibilityId_fkey" FOREIGN KEY ("visibilityId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
