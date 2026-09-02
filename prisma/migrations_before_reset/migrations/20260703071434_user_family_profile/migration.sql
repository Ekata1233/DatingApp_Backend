-- CreateTable
CREATE TABLE "user_family_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyStatusId" INTEGER,
    "familyTypeId" INTEGER,
    "fatherOccupationId" INTEGER,
    "fatherOrganisationId" INTEGER,
    "motherOccupationId" INTEGER,
    "motherOrganisationId" INTEGER,
    "siblingRelationId" INTEGER,
    "siblingOccupationId" INTEGER,
    "siblingMaritalId" INTEGER,
    "familyHomeId" INTEGER,
    "nativePlaceId" INTEGER,
    "familyIncomeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_family_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_values" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_income" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "minAmount" INTEGER,
    "maxAmount" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_income_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_family_profiles_userId_key" ON "user_family_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyStatusId_idx" ON "user_family_profiles"("familyStatusId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyTypeId_idx" ON "user_family_profiles"("familyTypeId");

-- CreateIndex
CREATE INDEX "user_family_profiles_fatherOccupationId_idx" ON "user_family_profiles"("fatherOccupationId");

-- CreateIndex
CREATE INDEX "user_family_profiles_motherOccupationId_idx" ON "user_family_profiles"("motherOccupationId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyHomeId_idx" ON "user_family_profiles"("familyHomeId");

-- CreateIndex
CREATE INDEX "user_family_profiles_nativePlaceId_idx" ON "user_family_profiles"("nativePlaceId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyIncomeId_idx" ON "user_family_profiles"("familyIncomeId");

-- CreateIndex
CREATE UNIQUE INDEX "master_categories_code_key" ON "master_categories"("code");

-- CreateIndex
CREATE INDEX "master_values_categoryId_idx" ON "master_values"("categoryId");

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyStatusId_fkey" FOREIGN KEY ("familyStatusId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyTypeId_fkey" FOREIGN KEY ("familyTypeId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_fatherOccupationId_fkey" FOREIGN KEY ("fatherOccupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_fatherOrganisationId_fkey" FOREIGN KEY ("fatherOrganisationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_motherOccupationId_fkey" FOREIGN KEY ("motherOccupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_motherOrganisationId_fkey" FOREIGN KEY ("motherOrganisationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_siblingRelationId_fkey" FOREIGN KEY ("siblingRelationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_siblingOccupationId_fkey" FOREIGN KEY ("siblingOccupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_siblingMaritalId_fkey" FOREIGN KEY ("siblingMaritalId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyHomeId_fkey" FOREIGN KEY ("familyHomeId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_nativePlaceId_fkey" FOREIGN KEY ("nativePlaceId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyIncomeId_fkey" FOREIGN KEY ("familyIncomeId") REFERENCES "family_income"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_values" ADD CONSTRAINT "master_values_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "master_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
