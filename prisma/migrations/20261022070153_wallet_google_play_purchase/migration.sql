-- CreateTable
CREATE TABLE "WalletGooglePlayPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "purchaseTokenHash" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletGooglePlayPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletGooglePlayPurchase_orderId_key" ON "WalletGooglePlayPurchase"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletGooglePlayPurchase_purchaseTokenHash_key" ON "WalletGooglePlayPurchase"("purchaseTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "WalletGooglePlayPurchase_walletTransactionId_key" ON "WalletGooglePlayPurchase"("walletTransactionId");

-- CreateIndex
CREATE INDEX "WalletGooglePlayPurchase_userId_idx" ON "WalletGooglePlayPurchase"("userId");
