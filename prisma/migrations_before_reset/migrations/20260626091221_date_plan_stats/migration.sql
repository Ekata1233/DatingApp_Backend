-- CreateTable
CREATE TABLE "DatePlanPackage" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planCount" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "pricePerPlan" DECIMAL(10,2) NOT NULL,
    "discount" INTEGER,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDatePlanStats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserDatePlanStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDatePlanStats_userId_key" ON "UserDatePlanStats"("userId");

-- AddForeignKey
ALTER TABLE "UserDatePlanStats" ADD CONSTRAINT "UserDatePlanStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
