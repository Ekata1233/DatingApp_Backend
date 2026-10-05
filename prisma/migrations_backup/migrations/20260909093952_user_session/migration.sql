-- AlterTable
ALTER TABLE "EventBooking" ADD COLUMN     "cancellationComment" VARCHAR(500),
ADD COLUMN     "cancellationReason" VARCHAR(100),
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "refundAmount" DECIMAL(10,2),
ADD COLUMN     "refundEligible" BOOLEAN,
ADD COLUMN     "refundReason" TEXT,
ADD COLUMN     "refundReferenceId" VARCHAR(255),
ADD COLUMN     "refundRequestedAt" TIMESTAMP(3),
ADD COLUMN     "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deviceId" TEXT,
    "deviceName" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "logoutAt" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_userId_isActive_idx" ON "UserSession"("userId", "isActive");

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
