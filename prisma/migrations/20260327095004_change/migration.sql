-- AlterTable
ALTER TABLE "users" ADD COLUMN     "next_step" VARCHAR(20),
ALTER COLUMN "onboarding_step" DROP NOT NULL,
ALTER COLUMN "onboarding_step" DROP DEFAULT,
ALTER COLUMN "onboarding_step" SET DATA TYPE VARCHAR(20);
