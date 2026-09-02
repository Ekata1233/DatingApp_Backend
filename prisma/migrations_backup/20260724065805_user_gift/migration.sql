-- CreateEnum
CREATE TYPE "RoseType" AS ENUM ('PURCHASED');

-- CreateEnum
CREATE TYPE "ComplimentStatus" AS ENUM ('PENDING', 'READ', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "UserRose" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "type" "RoseType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoseBalance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "purchasedRoses" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoseBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompliment" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "ideaId" TEXT,
    "message" VARCHAR(250),
    "status" "ComplimentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompliment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGift" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "giftId" INTEGER NOT NULL,
    "giftName" TEXT NOT NULL,
    "pricePaid" INTEGER NOT NULL,
    "message" VARCHAR(150),
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserRose_senderId_idx" ON "UserRose"("senderId");

-- CreateIndex
CREATE INDEX "UserRose_receiverId_idx" ON "UserRose"("receiverId");

-- CreateIndex
CREATE INDEX "UserRose_senderId_receiverId_idx" ON "UserRose"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoseBalance_userId_key" ON "UserRoseBalance"("userId");

-- CreateIndex
CREATE INDEX "UserCompliment_senderId_idx" ON "UserCompliment"("senderId");

-- CreateIndex
CREATE INDEX "UserCompliment_receiverId_status_idx" ON "UserCompliment"("receiverId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserGift_walletTransactionId_key" ON "UserGift"("walletTransactionId");

-- CreateIndex
CREATE INDEX "UserGift_receiverId_idx" ON "UserGift"("receiverId");

-- CreateIndex
CREATE INDEX "UserGift_senderId_idx" ON "UserGift"("senderId");

-- CreateIndex
CREATE INDEX "UserGift_giftId_idx" ON "UserGift"("giftId");

-- AddForeignKey
ALTER TABLE "UserRose" ADD CONSTRAINT "UserRose_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRose" ADD CONSTRAINT "UserRose_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoseBalance" ADD CONSTRAINT "UserRoseBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "compliment_ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
