-- CreateTable
CREATE TABLE "location_master" (
    "id" SERIAL NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "capital" TEXT,
    "population" BIGINT,
    "populationProper" BIGINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_master_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_master_city_idx" ON "location_master"("city");

-- CreateIndex
CREATE INDEX "location_master_state_idx" ON "location_master"("state");

-- CreateIndex
CREATE INDEX "location_master_countryCode_idx" ON "location_master"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "location_master_city_state_countryCode_key" ON "location_master"("city", "state", "countryCode");
