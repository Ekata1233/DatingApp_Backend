-- CreateTable
CREATE TABLE "package_programs" (
    "id" UUID NOT NULL,
    "packageType" "PackageType" NOT NULL,
    "title" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "condition" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_program_destinations" (
    "id" UUID NOT NULL,
    "programId" UUID NOT NULL,
    "city" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imageFileId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_program_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "package_programs_packageType_isActive_idx" ON "package_programs"("packageType", "isActive");

-- CreateIndex
CREATE INDEX "package_program_destinations_programId_idx" ON "package_program_destinations"("programId");

-- AddForeignKey
ALTER TABLE "package_program_destinations" ADD CONSTRAINT "package_program_destinations_programId_fkey" FOREIGN KEY ("programId") REFERENCES "package_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
