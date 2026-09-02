-- CreateTable
CREATE TABLE "DatePlanPackageInfo" (
    "id" UUID NOT NULL,
    "howOnePlanWorks" JSONB,
    "whyPeopleBuyPlans" JSONB,
    "goodToKnow" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackageInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanPackageFeatures" (
    "id" UUID NOT NULL,
    "costToPostPlan" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "costToPostPlanActive" BOOLEAN NOT NULL DEFAULT true,
    "costToPostPlanPaidOnly" BOOLEAN NOT NULL DEFAULT false,
    "planBoostPrice" DECIMAL(10,2) NOT NULL DEFAULT 40,
    "planBoostActive" BOOLEAN NOT NULL DEFAULT true,
    "planBoostPaidOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackageFeatures_pkey" PRIMARY KEY ("id")
);
