-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_intentionId_fkey";

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "IntentionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
