-- AlterTable

-- CreateTable
CREATE TABLE "compliment_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compliment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliment_ideas" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliment_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compliment_categories_name_key" ON "compliment_categories"("name");

-- CreateIndex
CREATE INDEX "compliment_ideas_categoryId_sortOrder_idx" ON "compliment_ideas"("categoryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "compliment_ideas" ADD CONSTRAINT "compliment_ideas_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "compliment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
