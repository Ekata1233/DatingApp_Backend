-- DropForeignKey
ALTER TABLE "DatePlanUserStats" DROP CONSTRAINT "DatePlanUserStats_userId_fkey";

-- DropForeignKey
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_userId_fkey";

-- DropForeignKey
ALTER TABLE "user_family_profiles" DROP CONSTRAINT "user_family_profiles_userId_fkey";

-- CreateIndex
CREATE INDEX "plan_prices_packageId_idx" ON "plan_prices"("packageId");

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanUserStats" ADD CONSTRAINT "DatePlanUserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
