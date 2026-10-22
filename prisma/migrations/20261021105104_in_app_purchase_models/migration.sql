-- CreateEnum
CREATE TYPE "InAppPlatform" AS ENUM ('ANDROID', 'IOS');

-- CreateTable
CREATE TABLE "in_app_products" (
    "id" UUID NOT NULL,
    "priceId" UUID NOT NULL,
    "platform" "InAppPlatform" NOT NULL,
    "productId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "in_app_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "in_app_purchases" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "userPackageId" UUID,
    "platform" "InAppPlatform" NOT NULL,
    "productId" TEXT NOT NULL,
    "priceId" UUID NOT NULL,
    "purchaseTokenHash" VARCHAR(64),
    "transactionId" TEXT,
    "originalTransactionId" TEXT,
    "environment" TEXT,
    "storeStatus" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "rawResponse" JSONB,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "in_app_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "in_app_products_platform_productId_key" ON "in_app_products"("platform", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_products_priceId_platform_key" ON "in_app_products"("priceId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_purchases_paymentId_key" ON "in_app_purchases"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_purchases_purchaseTokenHash_key" ON "in_app_purchases"("purchaseTokenHash");

-- CreateIndex
CREATE INDEX "in_app_purchases_userId_idx" ON "in_app_purchases"("userId");

-- CreateIndex
CREATE INDEX "in_app_purchases_platform_originalTransactionId_idx" ON "in_app_purchases"("platform", "originalTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "in_app_purchases_platform_transactionId_key" ON "in_app_purchases"("platform", "transactionId");

-- AddForeignKey
ALTER TABLE "in_app_products" ADD CONSTRAINT "in_app_products_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_purchases" ADD CONSTRAINT "in_app_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_purchases" ADD CONSTRAINT "in_app_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_purchases" ADD CONSTRAINT "in_app_purchases_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "in_app_purchases" ADD CONSTRAINT "in_app_purchases_userPackageId_fkey" FOREIGN KEY ("userPackageId") REFERENCES "user_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
