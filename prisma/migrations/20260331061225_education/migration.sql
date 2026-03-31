-- CreateEnum
CREATE TYPE "LookingFor" AS ENUM ('DATE_TO_MARRY', 'DATING', 'MATURE_CONNECTION');

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
CREATE TYPE "EducationType" AS ENUM ('BCOM', 'CA_CPA', 'CS', 'BSC_BFIN', 'MCOM', 'MENG', 'MS_ENGINEERING', 'AE', 'AET', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeRangeType" AS ENUM ('UPTO_1_LAKH', 'INR_1_TO_2_LAKH', 'INR_2_TO_4_LAKH', 'INR_4_TO_7_LAKH', 'INR_10_TO_15_LAKH', 'INR_15_TO_20_LAKH', 'INR_20_TO_30_LAKH', 'INR_30_TO_50_LAKH', 'INR_50_TO_75_LAKH', 'ABOVE_75_LAKH');

-- CreateEnum
CREATE TYPE "WorkingWith" AS ENUM ('PRIVATE_COMPANY', 'GOVERNMENT', 'CIVIL_SERVICES', 'SELF_EMPLOYED', 'NOT_WORKING');

-- CreateEnum
CREATE TYPE "WorkingAs" AS ENUM ('SOFTWARE_ENGINEER', 'DOCTOR', 'TEACHER', 'BUSINESS_OWNER', 'OTHER');

-- CreateEnum
CREATE TYPE "QuestionCategory" AS ENUM ('DATING', 'DATE_TO_MARRY', 'MATURE_CONNECTION');

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
    "gender" VARCHAR(20),
    "looking_for" "LookingFor",
    "onboarding_step" VARCHAR(20),
    "next_step" VARCHAR(20),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

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
    "highestEdu" "EducationType" NOT NULL,
    "collegeName" VARCHAR(100),
    "incomeRange" "IncomeRangeType" NOT NULL,
    "minIncome" INTEGER,
    "maxIncome" INTEGER,
    "workingWith" "WorkingWith",
    "workingAs" "WorkingAs",
    "companyName" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

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

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

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

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_about" ADD CONSTRAINT "user_about_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAnswer" ADD CONSTRAINT "UserAnswer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "QuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
