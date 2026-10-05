-- CreateEnum
CREATE TYPE "PayoutMethodType" AS ENUM ('BANK_ACCOUNT', 'UPI');

-- CreateEnum
CREATE TYPE "MessagePermission" AS ENUM ('MATCHES_ONLY', 'VERIFIED_ONLY', 'PAID_ONLY');

-- CreateTable
CREATE TABLE "UserNotificationSetting" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "mutedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserNotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_amount" (
    "id" UUID NOT NULL,
    "gst" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "eventPlatformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_amount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPayoutMethod" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "PayoutMethodType" NOT NULL,
    "accountHolderName" VARCHAR(150),
    "accountNumberEncrypted" TEXT,
    "accountNumberLast4" VARCHAR(4),
    "ifscCode" VARCHAR(20),
    "bankName" VARCHAR(150),
    "bankIsPrimary" BOOLEAN NOT NULL DEFAULT false,
    "bankIsVerified" BOOLEAN NOT NULL DEFAULT false,
    "bankIsActive" BOOLEAN NOT NULL DEFAULT true,
    "upiId" VARCHAR(150),
    "upiIsPrimary" BOOLEAN NOT NULL DEFAULT false,
    "upiIsVerified" BOOLEAN NOT NULL DEFAULT false,
    "upiIsActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserPayoutMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrivacySettings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "messagePermission" "MessagePermission" NOT NULL DEFAULT 'MATCHES_ONLY',
    "hideFromContacts" BOOLEAN NOT NULL DEFAULT false,
    "ghostMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserNotificationSetting_userId_key" ON "UserNotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "UserNotificationSetting_userId_idx" ON "UserNotificationSetting"("userId");

-- CreateIndex
CREATE INDEX "UserPayoutMethod_userId_idx" ON "UserPayoutMethod"("userId");

-- CreateIndex
CREATE INDEX "UserPayoutMethod_userId_type_idx" ON "UserPayoutMethod"("userId", "type");

-- CreateIndex
CREATE INDEX "UserPayoutMethod_userId_bankIsPrimary_idx" ON "UserPayoutMethod"("userId", "bankIsPrimary");

-- CreateIndex
CREATE INDEX "UserPayoutMethod_userId_upiIsPrimary_idx" ON "UserPayoutMethod"("userId", "upiIsPrimary");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrivacySettings_userId_key" ON "UserPrivacySettings"("userId");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_messagePermission_idx" ON "UserPrivacySettings"("messagePermission");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_hideFromContacts_idx" ON "UserPrivacySettings"("hideFromContacts");

-- CreateIndex
CREATE INDEX "UserPrivacySettings_ghostMode_idx" ON "UserPrivacySettings"("ghostMode");

-- AddForeignKey
ALTER TABLE "UserNotificationSetting" ADD CONSTRAINT "UserNotificationSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPayoutMethod" ADD CONSTRAINT "UserPayoutMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
