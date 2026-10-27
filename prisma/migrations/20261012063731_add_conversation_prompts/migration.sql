
-- CreateTable
CREATE TABLE "conversation_prompt_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_prompt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_prompts" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "label" VARCHAR(100),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_prompt_categories_slug_key" ON "conversation_prompt_categories"("slug");

-- CreateIndex
CREATE INDEX "conversation_prompt_categories_isActive_sortOrder_idx" ON "conversation_prompt_categories"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "conversation_prompts_categoryId_isActive_sortOrder_idx" ON "conversation_prompts"("categoryId", "isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "conversation_prompts" ADD CONSTRAINT "conversation_prompts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "conversation_prompt_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
