-- CreateTable
CREATE TABLE "user_prompts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "answer" VARCHAR(300) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxLength" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_prompts_userId_idx" ON "user_prompts"("userId");

-- CreateIndex
CREATE INDEX "user_prompts_promptId_idx" ON "user_prompts"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompts_userId_promptId_key" ON "user_prompts"("userId", "promptId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_categories_name_key" ON "prompt_categories"("name");

-- CreateIndex
CREATE INDEX "prompts_categoryId_idx" ON "prompts"("categoryId");

-- CreateIndex
CREATE INDEX "prompts_active_idx" ON "prompts"("active");

-- AddForeignKey
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "prompt_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
