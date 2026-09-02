-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('PREMIUM', 'VIP', 'VIP_ELITE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'NON_BINARY', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "GenderOption" AS ENUM ('STRAIGHT', 'GAY', 'LESBIAN', 'AROMATIC', 'ASEXUAL', 'BISEXUAL', 'DEMISEXUAL', 'PANSEXUAL', 'QUEER', 'NOT_LISTED');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('BOOST', 'PRIMETIME', 'SUPER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('DATE_TO_MARRY', 'DATING', 'MATURE_CONNECTION');

-- CreateEnum
CREATE TYPE "LookingForOption" AS ENUM ('LONG_TERM', 'SHORT_TERM', 'NEW_FRIENDS', 'CASUAL', 'COMPANIONSHIP', 'LIFE_PARTNER', 'TRAVEL_PARTNER', 'EMOTIONAL_SUPPORT', 'FRIENDSHIP_FIRST');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'AWAITING_DIVORCE', 'ANNULLED');

-- CreateEnum
CREATE TYPE "ChildStatus" AS ENUM ('YES', 'NO', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "NumberOfChildren" AS ENUM ('ONE', 'TWO', 'THREE', 'FOUR', 'FIVE_PLUS');

-- CreateEnum
CREATE TYPE "ChildLivingArrangement" AS ENUM ('YES', 'NO', 'SOMETIME');

-- CreateEnum
CREATE TYPE "LivingSituation" AS ENUM ('OWN_HOME', 'LIVING_ALONE', 'WITH_CHILDREN', 'WITH_FAMILY', 'RENTED_HOME', 'SENIOR_LIVING_COMMUNITY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeRangeType" AS ENUM ('UPTO_1_LAKH', 'INR_1_TO_2_LAKH', 'INR_2_TO_4_LAKH', 'INR_4_TO_7_LAKH', 'INR_10_TO_15_LAKH', 'INR_15_TO_20_LAKH', 'INR_20_TO_30_LAKH', 'INR_30_TO_50_LAKH', 'INR_50_TO_75_LAKH', 'ABOVE_75_LAKH');

-- CreateEnum
CREATE TYPE "WorkingWith" AS ENUM ('PRIVATE_COMPANY', 'GOVERNMENT', 'CIVIL_SERVICES', 'SELF_EMPLOYED', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('DATING', 'DATE_TO_MARRY', 'MATURE_CONNECTION');

-- CreateEnum
CREATE TYPE "QuestionScreen" AS ENUM ('LIFESTYLE', 'REAL_U_MATTERS', 'THINGS_U_LOVE', 'INTEREST_HOBBY', 'DREAM_PLAN', 'HEALTH_WELLNESS');

-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'PASS', 'SUPERLIKE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" VARCHAR(100),
    "email" VARCHAR(255),
    "phone_number" VARCHAR(20),
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "google_id" VARCHAR(255),
    "birth_date" DATE,
    "height" INTEGER,
    "gender" "Gender",
    "gender_option" "GenderOption",
    "looking_for" "LookingFor",
    "onboarding_step" VARCHAR(20),
    "next_step" VARCHAR(20),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "current_subscription_id" TEXT,
    "profile_completion" INTEGER NOT NULL DEFAULT 0,
    "looking_for_option" "LookingForOption",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "religion" VARCHAR(50),
    "community" VARCHAR(50),
    "interested_in" VARCHAR(30),
    "sexual_orientation" VARCHAR(50),
    "country" VARCHAR(30),
    "state" VARCHAR(30),
    "city" VARCHAR(30),
    "max_distance_km" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_about" (
    "user_id" UUID NOT NULL,
    "maritalStatus" "MaritalStatus",
    "childStatus" "ChildStatus",
    "numberOfChildren" "NumberOfChildren",
    "childLivingArrangement" "ChildLivingArrangement",
    "livingSituation" "LivingSituation",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_about_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_edu_work" (
    "userId" UUID NOT NULL,
    "collegeName" VARCHAR(100),
    "incomeRange" "IncomeRangeType",
    "minIncome" INTEGER,
    "maxIncome" INTEGER,
    "workingWith" "WorkingWith",
    "companyName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "highestEdu" VARCHAR(100),
    "workingAs" VARCHAR(100),

    CONSTRAINT "user_edu_work_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "QuestionCategory" NOT NULL,
    "isMulti" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "screen" "QuestionScreen" NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionOption" (
    "id" TEXT NOT NULL,
    "question_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAnswer" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "option_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_photos" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "media_type" TEXT NOT NULL DEFAULT 'image',
    "media_url" TEXT NOT NULL,

    CONSTRAINT "user_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_bio" (
    "user_id" UUID NOT NULL,
    "bio" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_bio_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipes" (
    "id" UUID NOT NULL,
    "swiperId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "action" "SwipeAction" NOT NULL,
    "isMutual" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "user1Id" UUID NOT NULL,
    "user2Id" UUID NOT NULL,
    "matched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_message_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boosts" (
    "id" TEXT NOT NULL,
    "name" "BoostType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_options" (
    "id" TEXT NOT NULL,
    "boost_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "boostCount" INTEGER NOT NULL,
    "pricePerBoost" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2) NOT NULL,
    "discount_percent" INTEGER,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "is_best_value" BOOLEAN NOT NULL DEFAULT false,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" "PackageType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "themeColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackagePlan" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "durationMonths" INTEGER NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "discountedPrice" DECIMAL(10,2),
    "discountPercent" DOUBLE PRECISION,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isBestValue" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackagePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageFeature" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageFeature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "daily_swipe_count" INTEGER NOT NULL DEFAULT 0,
    "daily_like_count" INTEGER NOT NULL DEFAULT 0,
    "last_reset_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boostsRemaining" INTEGER,
    "boostsTotal" INTEGER,
    "packageId" TEXT NOT NULL,
    "packageOptionId" TEXT NOT NULL,
    "pricePaid" DOUBLE PRECISION NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "boostOptionId" TEXT,

    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_current_subscription_id_key" ON "users"("current_subscription_id");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_gender_created_at_idx" ON "users"("gender", "created_at");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_profiles_religion_idx" ON "user_profiles"("religion");

-- CreateIndex
CREATE INDEX "user_profiles_community_idx" ON "user_profiles"("community");

-- CreateIndex
CREATE INDEX "user_profiles_interested_in_idx" ON "user_profiles"("interested_in");

-- CreateIndex
CREATE INDEX "user_profiles_sexual_orientation_idx" ON "user_profiles"("sexual_orientation");

-- CreateIndex
CREATE INDEX "user_profiles_country_state_city_idx" ON "user_profiles"("country", "state", "city");

-- CreateIndex
CREATE INDEX "user_profiles_latitude_longitude_idx" ON "user_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "user_about_maritalStatus_idx" ON "user_about"("maritalStatus");

-- CreateIndex
CREATE INDEX "user_about_childStatus_idx" ON "user_about"("childStatus");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_incomeRange_idx" ON "user_edu_work"("incomeRange");

-- CreateIndex
CREATE INDEX "user_edu_work_workingWith_idx" ON "user_edu_work"("workingWith");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_incomeRange_workingWith_idx" ON "user_edu_work"("highestEdu", "incomeRange", "workingWith");

-- CreateIndex
CREATE INDEX "user_edu_work_minIncome_maxIncome_idx" ON "user_edu_work"("minIncome", "maxIncome");

-- CreateIndex
CREATE UNIQUE INDEX "Question_key_key" ON "Question"("key");

-- CreateIndex
CREATE INDEX "QuestionOption_question_id_idx" ON "QuestionOption"("question_id");

-- CreateIndex
CREATE INDEX "UserAnswer_user_id_idx" ON "UserAnswer"("user_id");

-- CreateIndex
CREATE INDEX "UserAnswer_question_id_idx" ON "UserAnswer"("question_id");

-- CreateIndex
CREATE INDEX "UserAnswer_option_id_idx" ON "UserAnswer"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_user_id_question_id_option_id_key" ON "UserAnswer"("user_id", "question_id", "option_id");

-- CreateIndex
CREATE INDEX "user_photos_user_id_idx" ON "user_photos"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "UserReport_reporterId_reportedId_key" ON "UserReport"("reporterId", "reportedId");

-- CreateIndex
CREATE INDEX "swipes_swiperId_idx" ON "swipes"("swiperId");

-- CreateIndex
CREATE INDEX "swipes_targetUserId_idx" ON "swipes"("targetUserId");

-- CreateIndex
CREATE INDEX "swipes_action_idx" ON "swipes"("action");

-- CreateIndex
CREATE INDEX "swipes_created_at_idx" ON "swipes"("created_at");

-- CreateIndex
CREATE INDEX "swipes_swiperId_action_idx" ON "swipes"("swiperId", "action");

-- CreateIndex
CREATE INDEX "swipes_targetUserId_action_idx" ON "swipes"("targetUserId", "action");

-- CreateIndex
CREATE UNIQUE INDEX "swipes_swiperId_targetUserId_key" ON "swipes"("swiperId", "targetUserId");

-- CreateIndex
CREATE INDEX "matches_user1Id_idx" ON "matches"("user1Id");

-- CreateIndex
CREATE INDEX "matches_user2Id_idx" ON "matches"("user2Id");

-- CreateIndex
CREATE INDEX "matches_matched_at_idx" ON "matches"("matched_at");

-- CreateIndex
CREATE INDEX "matches_last_message_at_idx" ON "matches"("last_message_at");

-- CreateIndex
CREATE INDEX "matches_is_active_idx" ON "matches"("is_active");

-- CreateIndex
CREATE INDEX "matches_user1Id_is_active_idx" ON "matches"("user1Id", "is_active");

-- CreateIndex
CREATE INDEX "matches_user2Id_is_active_idx" ON "matches"("user2Id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "matches_user1Id_user2Id_key" ON "matches"("user1Id", "user2Id");

-- CreateIndex
CREATE UNIQUE INDEX "boosts_name_key" ON "boosts"("name");

-- CreateIndex
CREATE INDEX "boost_options_boost_id_idx" ON "boost_options"("boost_id");

-- CreateIndex
CREATE UNIQUE INDEX "Package_name_key" ON "Package"("name");

-- CreateIndex
CREATE INDEX "UserSubscription_userId_idx" ON "UserSubscription"("userId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_current_subscription_id_fkey" FOREIGN KEY ("current_subscription_id") REFERENCES "UserSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_about" ADD CONSTRAINT "user_about_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "QuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_photos" ADD CONSTRAINT "user_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bio" ADD CONSTRAINT "user_bio_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_options" ADD CONSTRAINT "boost_options_boost_id_fkey" FOREIGN KEY ("boost_id") REFERENCES "boosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackagePlan" ADD CONSTRAINT "PackagePlan_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageFeature" ADD CONSTRAINT "PackageFeature_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription" ADD CONSTRAINT "UserSubscription_boostOptionId_fkey" FOREIGN KEY ("boostOptionId") REFERENCES "boost_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
