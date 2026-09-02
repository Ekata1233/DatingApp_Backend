-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'SIGNUP_REWARDED', 'PACKAGE_REWARDED', 'WAITLIST_REWARDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Zodiac" AS ENUM ('ARIES', 'TAURUS', 'GEMINI', 'CANCER', 'LEO', 'VIRGO', 'LIBRA', 'SCORPIO', 'SAGITTARIUS', 'CAPRICORN', 'AQUARIUS', 'PISCES');

-- CreateEnum
CREATE TYPE "LoveLanguage" AS ENUM ('WORDS_OF_AFFIRMATION', 'QUALITY_TIME', 'ACTS_OF_SERVICE', 'PHYSICAL_TOUCH', 'RECEIVING_GIFTS');

-- CreateEnum
CREATE TYPE "CommunicationStyle" AS ENUM ('PHONE_CALLS_OVER_TEXTS', 'TEXTS_OVER_CALLS', 'VIDEO_CALLS', 'VOICE_NOTES', 'IN_PERSON_ALWAYS', 'A_BIT_OF_EVERYTHING');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('HIGH_SCHOOL', 'ITI', 'DIPLOMA', 'UNDERGRADUATE', 'BACHELOR', 'POSTGRADUATE', 'MASTER', 'MPHIL', 'PHD', 'POST_DOCTORATE');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "PromptVisibility" AS ENUM ('EVERYONE', 'PREMIUM_AND_ABOVE', 'VIP_AND_ABOVE', 'ELITE_ONLY');

-- CreateEnum
CREATE TYPE "BoostTransactionType" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'USE', 'REFUND', 'EXPIRE', 'ADMIN_ADD', 'ADMIN_REMOVE');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('VIEW', 'LIKE', 'INTEREST', 'REACH');

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('PREMIUM', 'VIP', 'VIP_ELITE');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY', 'LIFETIME');

-- CreateEnum
CREATE TYPE "FeatureCategory" AS ENUM ('MATCH_DISCOVERY', 'CHAT', 'TRUST', 'PRIVACY', 'STATUS_BADGES', 'REAL_LIFE_EVENTS', 'PERKS', 'FOREVER_LOVE_PROGRAMME', 'ELITE_ACCESS', 'STATUS_PRIVACY', 'PREMIUM_EXPERIENCES', 'NETWORKING_GROWTH', 'EVERYTHING_IN_VIP', 'MAXIMUM_PRIVACY', 'CURATED_ELITE_MATCHING', 'ELITE_STATUS', 'WHITE_GLOVE_EXPERIENCES', 'GLOBAL_EXPERIENCES', 'EXECUTIVE_NETWORK');

-- CreateEnum
CREATE TYPE "ResetPeriod" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "RoseTransactionType" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'PACKAGE_SEND', 'PURCHASE_SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- CreateEnum
CREATE TYPE "ComplimentTransactionType" AS ENUM ('PACKAGE_CREDIT', 'PURCHASE', 'PACKAGE_SEND', 'PURCHASE_SEND', 'REFUND', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- CreateEnum
CREATE TYPE "ComplimentStatus" AS ENUM ('PENDING', 'READ', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('ABOUT', 'BASIC', 'VIDEO', 'PROMPT', 'PHOTO', 'CAREER', 'INTEREST', 'LIFESTYLE', 'FAMILY');

-- CreateEnum
CREATE TYPE "OptionType" AS ENUM ('ACTIVITY', 'QUICK_TITLE', 'VIBE', 'WHO_PAYS', 'JOIN_REQUEST_GENDER', 'PLAN_VISIBILITY');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'BOOKED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "DatePlanRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConfirmedDateStatus" AS ENUM ('UPCOMING', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DatePlanAttendanceStatus" AS ENUM ('MET', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "DatePlanFeedbackStatus" AS ENUM ('PENDING', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "DatePlanNoShowReason" AS ENUM ('TIMING_WAS_OFF', 'VENUE_TOO_FAR', 'SHORT_NOTICE', 'APPROVED_TOO_LATE', 'NOT_SURE');

-- CreateEnum
CREATE TYPE "DatePlanExperienceTag" AS ENUM ('RESPECTFUL', 'GREAT_CONVERSATION', 'ON_TIME', 'GENUINE', 'FUN', 'WOULD_MEET_AGAIN');

-- CreateEnum
CREATE TYPE "DatePlanReportReason" AS ENUM ('DID_NOT_SHOW_AS_DESCRIBED', 'MADE_ME_UNCOMFORTABLE', 'INAPPROPRIATE_BEHAVIOUR', 'FAKE_PROFILE', 'SAFETY_CONCERN');

-- CreateEnum
CREATE TYPE "DatePlanReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DatePlanTransactionType" AS ENUM ('PACKAGE_CREDIT', 'USAGE', 'EXPIRED', 'ADMIN_ADJUSTMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "EventTag" AS ENUM ('BRAND', 'PROMOTED', 'FEATURED');

-- CreateEnum
CREATE TYPE "EventBookingStatus" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'REFUND_PENDING', 'REFUNDED', 'ATTENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "EventTicketType" AS ENUM ('MEN', 'WOMEN', 'OTHER');

-- CreateEnum
CREATE TYPE "EventTicketStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'ATTENDED');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'LIVE', 'SOLD_OUT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('SINGLES_MIXER', 'SPEED_DATES', 'SINGLES_NIGHT', 'DINNER_DATES', 'ACTIVITY_MATCH', 'PLAY_AND_MATCH', 'TRAVEL_DATES', 'TREK_DATES', 'THE_RESERVE', 'PROFESSIONALS_MEET', 'OTHER_DATES');

-- CreateEnum
CREATE TYPE "GenderMix" AS ENUM ('FIFTY_FIFTY', 'WOMEN_LED', 'MEN_LED', 'OPEN');

-- CreateEnum
CREATE TYPE "EventIntent" AS ENUM ('MIXED', 'SERIOUS', 'CASUAL');

-- CreateEnum
CREATE TYPE "DressCode" AS ENUM ('CASUAL', 'SMART_CASUAL', 'SEMI_FORMAL', 'FORMAL', 'COCKTAIL', 'TRADITIONAL');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'REFUND', 'PURCHASE', 'REWARD', 'PACKAGE_BONUS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('PACKAGE_ACTIVATION', 'WALLET_TOPUP', 'PREMIUM_PLAN', 'BOOST_PURCHASE', 'SUPER_LIKE', 'DATE_PLAN_BOOKING', 'DATE_PLAN_REFUND', 'WITHDRAWAL', 'REFERRAL_SIGNUP', 'REFERRAL_PURCHASE', 'WAITLIST_REFERRAL_SIGNUP', 'WAITLIST_REFERRAL_PAYMENT', 'GIFT_PURCHASE');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'DATE_INVITE', 'DATE_CONFIRMED', 'DATE_CANCELLED', 'SYSTEM', 'ROSE', 'GIFT', 'COMPLIMENT', 'ENGAGEMENT', 'EVENT_INVITE', 'EVENT_CONFIRM', 'EVENT_CANCEL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_LIKE', 'NEW_MATCH', 'NEW_MESSAGE', 'NEW_ROSE', 'NEW_GIFT', 'NEW_COMPLIMENT', 'EVENT_INVITE', 'EVENT_RESPONSE', 'PROFILE_VIEW', 'SUPER_LIKE', 'SUBSCRIPTION_EXPIRING', 'BOOST_STARTED', 'BOOST_EXPIRING');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MEN', 'WOMEN', 'NON_BINARY', 'TRANS_MAN', 'TRANS_WOMAN', 'OTHER', 'PREFER_NOT_TO_SAY', 'EVERYONE');

-- CreateEnum
CREATE TYPE "GenderOption" AS ENUM ('STRAIGHT', 'GAY', 'LESBIAN', 'AROMATIC', 'ASEXUAL', 'BISEXUAL', 'DEMISEXUAL', 'PANSEXUAL', 'QUEER', 'NOT_LISTED');

-- CreateEnum
CREATE TYPE "BoostType" AS ENUM ('BOOST', 'PRIMETIME', 'SUPER');

-- CreateEnum
CREATE TYPE "BoostStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'FAILED', 'REFUNDED');

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
CREATE TYPE "QuestionScreen" AS ENUM ('LIFESTYLE', 'REAL_U_MATTERS', 'THINGS_U_LOVE', 'INTEREST_HOBBY', 'DREAM_PLAN', 'HEALTH_WELLNESS', 'NETWORKING_INTENT');

-- CreateEnum
CREATE TYPE "SwipeAction" AS ENUM ('LIKE', 'PASS', 'SUPERLIKE');

-- CreateEnum
CREATE TYPE "WaitlistPlan" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('WAITLIST', 'PACKAGE', 'BOOST', 'COINS', 'WALLET', 'PURCHASE_STORE', 'EVENT_BOOKING', 'OTHER');

-- CreateEnum
CREATE TYPE "WaitlistSource" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'GOOGLE', 'WEBSITE', 'REFERRAL', 'YOUTUBE', 'LINKEDIN', 'OTHER');

-- CreateEnum
CREATE TYPE "LaunchBenefit" AS ENUM ('ONE_MONTH_PREMIUM', 'THREE_MONTH_PREMIUM', 'LIFETIME_DISCOUNT');

-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('AADHAR', 'PAN', 'PASSPORT');

-- CreateEnum
CREATE TYPE "PermissionModule" AS ENUM ('DASHBOARD', 'EMPLOYEE', 'EMPLOYEE_ROLE', 'USER', 'EVENT', 'PAYMENT', 'REPORT', 'SETTINGS');

-- CreateEnum
CREATE TYPE "PartnerStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL', 'LLP', 'PRIVATE_LIMITED', 'PARTNERSHIP', 'OPC', 'NGO', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchasePaymentMethod" AS ENUM ('PACKAGE', 'WALLET', 'PAYMENT_GATEWAY');

-- CreateEnum
CREATE TYPE "StoreFeatureType" AS ENUM ('ROSE_SEND_COST', 'REVEAL_ROSE_SENDER', 'WHO_LIKED_YOU_REVEAL_COST', 'COMPLIMENT_SEND_COST', 'REVEAL_COMPLIMENT_SENDER', 'REVEAL_LIKED_YOU', 'BOOST_DURATION', 'BOOST_SINGLE_PRICE', 'BOOST_VISIBILITY_MULTIPLIER', 'SUPER_BOOST_DURATION', 'SUPER_BOOST_SINGLE_PRICE', 'SUPER_BOOST_VISIBILITY_MULTIPLIER', 'DATE_PLAN_POST_COST', 'DATE_PLAN_BOOST_COST', 'DATE_PLAN_FREE_FOR_VIP');

-- CreateEnum
CREATE TYPE "StoreItemType" AS ENUM ('ROSE', 'COMPLIMENT', 'BOOST', 'SUPER_BOOST', 'DATE_PLAN', 'COINS');

-- CreateEnum
CREATE TYPE "StorePackBadge" AS ENUM ('NONE', 'MOST_POPULAR', 'BEST_VALUE');

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
    "intentionId" UUID,
    "onboarding_step" VARCHAR(20),
    "next_step" VARCHAR(20),
    "onboarding_completed" BOOLEAN NOT NULL DEFAULT false,
    "last_active_at" TIMESTAMP(3),
    "device_token" TEXT,
    "referralCode" VARCHAR(20),
    "badge_count" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "profile_completion" INTEGER NOT NULL DEFAULT 0,
    "looking_for_option" "LookingForOption",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" UUID NOT NULL,
    "religionId" INTEGER,
    "communityId" INTEGER,
    "interested_in" "Gender",
    "sexual_orientation" "GenderOption",
    "country" VARCHAR(30),
    "state" VARCHAR(30),
    "city" VARCHAR(30),
    "area" VARCHAR(30),
    "max_distance_km" INTEGER,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "UserReferral" (
    "id" UUID NOT NULL,
    "referrerId" UUID NOT NULL,
    "referredUserId" UUID NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "signupReward" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "purchaseReward" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rewardedAt" TIMESTAMP(3),
    "purchaseAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReferralStats" (
    "userId" UUID NOT NULL,
    "totalInvites" INTEGER NOT NULL DEFAULT 0,
    "joinedUsers" INTEGER NOT NULL DEFAULT 0,
    "pendingRewards" INTEGER NOT NULL DEFAULT 0,
    "rewardedUsers" INTEGER NOT NULL DEFAULT 0,
    "totalCoinsEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserReferralStats_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_languages" (
    "userId" UUID NOT NULL,
    "languageId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_languages_pkey" PRIMARY KEY ("userId","languageId")
);

-- CreateTable
CREATE TABLE "religions" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "religions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communities" (
    "id" SERIAL NOT NULL,
    "religionId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_about" (
    "user_id" UUID NOT NULL,
    "maritalStatus" "MaritalStatus",
    "childStatus" "ChildStatus",
    "numberOfChildren" "NumberOfChildren",
    "childLivingArrangement" "ChildLivingArrangement",
    "livingSituation" "LivingSituation",
    "zodiac" "Zodiac",
    "loveLanguage" "LoveLanguage",
    "communicationStyle" "CommunicationStyle",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_about_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "user_edu_work" (
    "userId" UUID NOT NULL,
    "highestEdu" "EducationLevel",
    "degree" VARCHAR(100),
    "collegeName" VARCHAR(100),
    "graduationYear" INTEGER,
    "professionId" INTEGER,
    "companyName" VARCHAR(100),
    "employmentTypeId" INTEGER,
    "experienceId" INTEGER,
    "ambitionId" INTEGER,
    "salaryRangeId" INTEGER,
    "bigDreams" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_edu_work_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_family_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyStatusId" INTEGER,
    "familyTypeId" INTEGER,
    "fatherOccupationId" INTEGER,
    "fatherOrganisationId" INTEGER,
    "motherOccupationId" INTEGER,
    "motherOrganisationId" INTEGER,
    "familyHomeId" INTEGER,
    "nativePlaceId" INTEGER,
    "familyIncomeId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_family_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_siblings" (
    "id" UUID NOT NULL,
    "familyProfileId" UUID NOT NULL,
    "siblingTypeId" INTEGER NOT NULL,
    "maritalId" INTEGER,
    "occupationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_siblings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_categories" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_values" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "value" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "master_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "family_income" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "minAmount" INTEGER,
    "maxAmount" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "family_income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employment_types" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambitions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salary_ranges" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "minSalary" INTEGER,
    "maxSalary" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salary_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
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
    "description" TEXT,
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
    "media_type" "MediaType" NOT NULL DEFAULT 'IMAGE',
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
CREATE TABLE "user_prompts" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "promptId" UUID NOT NULL,
    "answer" VARCHAR(300) NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompts" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "question" VARCHAR(255) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "maxLength" INTEGER NOT NULL DEFAULT 200,
    "visibility" "PromptVisibility" NOT NULL DEFAULT 'EVERYONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBlock" (
    "id" UUID NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserReport" (
    "id" UUID NOT NULL,
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
CREATE TABLE "Intention" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Intention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntentionOption" (
    "id" UUID NOT NULL,
    "option" TEXT NOT NULL,
    "optDescription" TEXT,
    "intentionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boosts" (
    "id" UUID NOT NULL,
    "name" "BoostType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "boostDuration" INTEGER NOT NULL DEFAULT 30,
    "singleBoostWalletPrice" DECIMAL(10,2) NOT NULL DEFAULT 60,
    "visibilityMultiplier" INTEGER NOT NULL DEFAULT 10,
    "whyBoostWorks" JSONB,
    "boostVsSuperBoost" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_options" (
    "id" UUID NOT NULL,
    "boost_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "boostCount" INTEGER NOT NULL,
    "timePerBoost" INTEGER NOT NULL,
    "pricePerBoost" DECIMAL(10,2) NOT NULL,
    "discounted_price" DECIMAL(10,2) NOT NULL,
    "discount_percent" INTEGER,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "is_best_value" BOOLEAN NOT NULL DEFAULT false,
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boost_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_boosts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "boostId" UUID,
    "boost_option_id" UUID,
    "total_boosts" INTEGER NOT NULL DEFAULT 0,
    "remaining_boosts" INTEGER NOT NULL,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "last_reset_at" TIMESTAMP(3) NOT NULL,
    "next_reset_at" TIMESTAMP(3) NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_boosts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_usages" (
    "id" UUID NOT NULL,
    "user_boost_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "duration" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_interests" INTEGER NOT NULL DEFAULT 0,
    "total_reach" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_boost_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_likes" INTEGER NOT NULL DEFAULT 0,
    "total_interests" INTEGER NOT NULL DEFAULT 0,
    "total_reach" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_boost_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "boost_events" (
    "id" UUID NOT NULL,
    "boost_usage_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "actor_id" UUID NOT NULL,
    "event_type" "EventType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "boost_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "boostOptionId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paymentMethod" "PurchasePaymentMethod" NOT NULL,
    "paymentId" TEXT,
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoostTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "BoostTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "boostBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoostTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package" (
    "id" UUID NOT NULL,
    "name" "PackageType" NOT NULL,
    "slug" TEXT NOT NULL,
    "tagline" TEXT,
    "badgeLabel" TEXT,
    "discoveryPool" TEXT,
    "visibilityRule" TEXT,
    "description" TEXT,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_prices" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "months" INTEGER,
    "price" DECIMAL(10,2) NOT NULL,
    "originalPrice" DECIMAL(10,2),
    "discountPercent" INTEGER,
    "isHighlighted" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_feature" (
    "id" UUID NOT NULL,
    "category" "FeatureCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_limits" (
    "id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "unlimited" BOOLEAN NOT NULL DEFAULT false,
    "limit" INTEGER,
    "resetPeriod" "ResetPeriod" NOT NULL DEFAULT 'NONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_limits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_packages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "packageId" UUID NOT NULL,
    "priceId" UUID NOT NULL,
    "purchasePrice" DECIMAL(65,30) NOT NULL,
    "purchaseOriginalPrice" DECIMAL(65,30),
    "purchaseDiscount" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "autoRenew" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" UUID,
    "currentPackageId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plan_usage" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "featureId" UUID NOT NULL,
    "used" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_plan_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRose" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "targetType" "TargetType",
    "targetId" UUID,
    "requiredMessages" INTEGER NOT NULL DEFAULT 1,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRoseBalance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalRoses" INTEGER NOT NULL DEFAULT 0,
    "freeRoses" INTEGER NOT NULL DEFAULT 0,
    "purchasedRoses" INTEGER NOT NULL DEFAULT 0,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "totalRosesSent" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL,
    "nextResetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserRoseBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosePurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PurchasePaymentMethod" NOT NULL,
    "paymentId" TEXT,
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RosePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoseTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "RoseTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "roseBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoseTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompliment" (
    "id" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "receiverId" UUID NOT NULL,
    "targetType" "TargetType",
    "targetId" UUID,
    "ideaId" TEXT,
    "message" VARCHAR(140),
    "status" "ComplimentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompliment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_compliment_balance" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalCompliments" INTEGER NOT NULL DEFAULT 0,
    "freeCompliments" INTEGER NOT NULL DEFAULT 0,
    "purchasedCompliments" INTEGER NOT NULL DEFAULT 0,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "totalComplimentsSent" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL,
    "nextResetAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_compliment_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplimentPurchase" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentMethod" "PurchasePaymentMethod" NOT NULL,
    "paymentId" TEXT,
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplimentPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplimentTransaction" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ComplimentTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "complimentBalanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplimentTransaction_pkey" PRIMARY KEY ("id")
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
    "targetType" "TargetType",
    "targetId" UUID,
    "walletTransactionId" UUID,
    "requiredMessages" INTEGER NOT NULL DEFAULT 1,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "isUnlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "payment_id" TEXT,
    "transactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "purpose" "PaymentPurpose" NOT NULL,
    "referenceId" UUID,
    "packagePriceId" UUID,
    "gatewayResponse" JSONB,
    "paidAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "receiver_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanPackage" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "planCount" INTEGER NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "pricePerPlan" DECIMAL(10,2) NOT NULL,
    "discount" INTEGER,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanPackageInfo" (
    "id" UUID NOT NULL,
    "howOnePlanWorks" JSONB,
    "whyPeopleBuyPlans" JSONB,
    "goodToKnow" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackageInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanPackageFeatures" (
    "id" UUID NOT NULL,
    "costToPostPlan" DECIMAL(10,2) NOT NULL DEFAULT 100,
    "costToPostPlanActive" BOOLEAN NOT NULL DEFAULT true,
    "costToPostPlanPaidOnly" BOOLEAN NOT NULL DEFAULT false,
    "planBoostPrice" DECIMAL(10,2) NOT NULL DEFAULT 40,
    "planBoostActive" BOOLEAN NOT NULL DEFAULT true,
    "planBoostPaidOnly" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanPackageFeatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanOption" (
    "id" UUID NOT NULL,
    "type" "OptionType" NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlan" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "title" TEXT,
    "quickTitleId" UUID,
    "note" TEXT,
    "photoUrl" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "venueLat" DOUBLE PRECISION,
    "venueLng" DOUBLE PRECISION,
    "duration" INTEGER,
    "whoPaysId" UUID,
    "participantLimit" INTEGER,
    "joinRequestGenderId" UUID,
    "visibilityId" UUID,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "eventDateTime" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanVibe" (
    "id" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "vibeId" UUID NOT NULL,

    CONSTRAINT "DatePlanVibe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanRequest" (
    "id" TEXT NOT NULL,
    "planId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "status" "DatePlanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanSkip" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatePlanSkip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DateConfirmed" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "hostUserId" UUID NOT NULL,
    "participantId" UUID NOT NULL,
    "title" TEXT,
    "venueName" TEXT,
    "venueAddress" TEXT,
    "eventDateTime" TIMESTAMP(3) NOT NULL,
    "status" "ConfirmedDateStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DateConfirmed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanFeedback" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "reviewerId" UUID NOT NULL,
    "attendanceStatus" "DatePlanAttendanceStatus" NOT NULL,
    "metUserId" UUID,
    "overallRating" INTEGER,
    "personRating" INTEGER,
    "noShowReason" "DatePlanNoShowReason",
    "comment" TEXT,
    "status" "DatePlanFeedbackStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanFeedbackTag" (
    "id" UUID NOT NULL,
    "feedbackId" UUID NOT NULL,
    "tag" "DatePlanExperienceTag" NOT NULL,

    CONSTRAINT "DatePlanFeedbackTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanReport" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "reporterId" UUID NOT NULL,
    "reportedUserId" UUID NOT NULL,
    "reason" "DatePlanReportReason" NOT NULL,
    "comment" TEXT,
    "status" "DatePlanReportStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatePlanUserStats" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "totalDatePlan" INTEGER NOT NULL DEFAULT 0,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "purchasedDataPlan" INTEGER NOT NULL DEFAULT 0,
    "weeklyLimit" INTEGER NOT NULL DEFAULT 0,
    "totalDetePlanUsed" INTEGER NOT NULL DEFAULT 0,
    "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatePlanUserStats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plan_purchases" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0.00,
    "paymentMethod" "PurchasePaymentMethod" NOT NULL,
    "paymentId" TEXT,
    "walletTransactionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "date_plan_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "date_plan_transactions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "DatePlanTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "purchaseId" UUID,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "date_plan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationParticipant" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "lastReadAt" TIMESTAMP(3),
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "content" TEXT,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "mediaUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "roseId" UUID,
    "complimentId" UUID,
    "giftId" UUID,
    "eventId" UUID,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessageDeletion" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessageDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "eventType" "Type",
    "title" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'DRAFT',
    "city" TEXT,
    "eventPartnerId" TEXT,
    "eventTag" "EventTag",
    "eventDate" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "venueName" TEXT,
    "fullAddress" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "totalCapacity" INTEGER,
    "menCapacity" INTEGER,
    "womenCapacity" INTEGER,
    "otherCapacity" INTEGER,
    "menEntryPrice" DECIMAL(10,2),
    "womenEntryPrice" DECIMAL(10,2),
    "otherEntryPrice" DECIMAL(10,2),
    "discountPercentage" DECIMAL(5,2),
    "menDiscountedPrice" DECIMAL(10,2),
    "womenDiscountedPrice" DECIMAL(10,2),
    "otherDiscountedPrice" DECIMAL(10,2),
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "eventIntent" "EventIntent",
    "heroImage" TEXT,
    "aboutEvent" TEXT,
    "dressCode" "DressCode",
    "refundWindow" INTEGER,
    "termsConditions" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "basicsDone" BOOLEAN NOT NULL DEFAULT false,
    "hostDone" BOOLEAN NOT NULL DEFAULT false,
    "venueDone" BOOLEAN NOT NULL DEFAULT false,
    "ticketDone" BOOLEAN NOT NULL DEFAULT false,
    "experienceDone" BOOLEAN NOT NULL DEFAULT false,
    "safetyDone" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventGallery" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventAmenity" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventItinerary" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT,
    "dayNumber" INTEGER,
    "location" TEXT,
    "elevation" TEXT,
    "distance" TEXT,
    "accommodation" TEXT,
    "meals" TEXT,

    CONSTRAINT "EventItinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventWhyCome" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventWhyCome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSafety" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "EventSafety_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFAQ" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventFeatureTag" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventFeatureTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBooking" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "bookingNumber" VARCHAR(50) NOT NULL,
    "ticketCount" INTEGER NOT NULL DEFAULT 1,
    "ticketAmount" DECIMAL(10,2) NOT NULL,
    "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "gstAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "couponCode" VARCHAR(50),
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" "EventBookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBookingTicket" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "ticketId" VARCHAR(50) NOT NULL,
    "ticketType" "EventTicketType" NOT NULL,
    "ticketAmount" DECIMAL(10,2) NOT NULL,
    "qrCodeUrl" TEXT,
    "status" "EventTicketStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventBookingTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" UUID NOT NULL,
    "walletId" UUID NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "type" "TransactionType" NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "source" "TransactionSource",
    "referenceId" TEXT,
    "description" TEXT,
    "balanceBefore" DECIMAL(65,30) NOT NULL,
    "balanceAfter" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlists" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "waitlistNumber" INTEGER NOT NULL,
    "plan" "WaitlistPlan" NOT NULL DEFAULT 'FREE',
    "amountPaid" DECIMAL(10,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentId" UUID,
    "launchBenefit" "LaunchBenefit" NOT NULL DEFAULT 'ONE_MONTH_PREMIUM',
    "premiumActivated" BOOLEAN NOT NULL DEFAULT false,
    "premiumActivatedAt" TIMESTAMP(3),
    "source" "WaitlistSource",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waitlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaunchConfig" (
    "id" UUID NOT NULL,
    "waitlistEnabled" BOOLEAN NOT NULL DEFAULT true,
    "appLaunched" BOOLEAN NOT NULL DEFAULT false,
    "launchDate" TIMESTAMP(3),
    "originalPrice" DECIMAL(10,2) NOT NULL DEFAULT 799,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 500,
    "finalPrice" DECIMAL(10,2) NOT NULL DEFAULT 299,
    "welcomeCoins" INTEGER NOT NULL DEFAULT 100,
    "perks" JSONB,
    "totalBenefitsValue" DECIMAL(10,2),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_config" (
    "id" UUID NOT NULL,
    "signupReward" DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    "packageReward" DECIMAL(10,2) NOT NULL DEFAULT 500.00,
    "waitlistReward" DECIMAL(10,2) NOT NULL DEFAULT 300.00,
    "title" VARCHAR(100) NOT NULL DEFAULT 'How Rewards Work',
    "descriptions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reward_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" SERIAL NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "image" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coinCost" INTEGER NOT NULL,
    "triggerLine" VARCHAR(90),
    "receiverLine" VARCHAR(90),
    "isLive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliment_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compliment_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliment_ideas" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliment_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "password" TEXT NOT NULL,
    "image" TEXT,
    "address" TEXT,
    "identityType" "IdentityType",
    "identityNumber" VARCHAR(100),
    "identityImage" TEXT,
    "roleId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_roles" (
    "id" UUID NOT NULL,
    "roleName" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "module" "PermissionModule" NOT NULL,
    "all" BOOLEAN NOT NULL DEFAULT false,
    "add" BOOLEAN NOT NULL DEFAULT false,
    "view" BOOLEAN NOT NULL DEFAULT false,
    "update" BOOLEAN NOT NULL DEFAULT false,
    "delete" BOOLEAN NOT NULL DEFAULT false,
    "export" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_partners" (
    "id" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "legalEntity" TEXT NOT NULL,
    "businessType" "BusinessType" NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "experienceYears" INTEGER,
    "description" TEXT,
    "monthlyEventsMin" INTEGER,
    "monthlyEventsMax" INTEGER,
    "teamSize" INTEGER,
    "venueNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "areaName" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "pincode" TEXT,
    "coverageAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "logo" TEXT,
    "gstCertificate" TEXT,
    "businessProof" TEXT,
    "status" "PartnerStatus" NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_info" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tag" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_features" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "feature" "StoreFeatureType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "intValue" INTEGER,
    "decimalValue" DECIMAL(10,2),
    "boolValue" BOOLEAN,
    "unit" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "premiumFree" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_packs" (
    "id" UUID NOT NULL,
    "itemType" "StoreItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "pricePerUnit" DECIMAL(10,2) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "badge" "StorePackBadge" NOT NULL DEFAULT 'NONE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_packs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompatibility" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_referralCode_key" ON "users"("referralCode");

-- CreateIndex
CREATE INDEX "users_phone_number_idx" ON "users"("phone_number");

-- CreateIndex
CREATE INDEX "users_google_id_idx" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_gender_created_at_idx" ON "users"("gender", "created_at");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE INDEX "user_profiles_religionId_idx" ON "user_profiles"("religionId");

-- CreateIndex
CREATE INDEX "user_profiles_communityId_idx" ON "user_profiles"("communityId");

-- CreateIndex
CREATE INDEX "user_profiles_interested_in_idx" ON "user_profiles"("interested_in");

-- CreateIndex
CREATE INDEX "user_profiles_sexual_orientation_idx" ON "user_profiles"("sexual_orientation");

-- CreateIndex
CREATE INDEX "user_profiles_country_state_city_idx" ON "user_profiles"("country", "state", "city");

-- CreateIndex
CREATE INDEX "user_profiles_latitude_longitude_idx" ON "user_profiles"("latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "UserReferral_referredUserId_key" ON "UserReferral"("referredUserId");

-- CreateIndex
CREATE INDEX "UserReferral_status_idx" ON "UserReferral"("status");

-- CreateIndex
CREATE INDEX "UserReferral_referrerId_idx" ON "UserReferral"("referrerId");

-- CreateIndex
CREATE INDEX "UserReferral_referredUserId_idx" ON "UserReferral"("referredUserId");

-- CreateIndex
CREATE INDEX "UserReferral_createdAt_idx" ON "UserReferral"("createdAt");

-- CreateIndex
CREATE INDEX "user_languages_languageId_idx" ON "user_languages"("languageId");

-- CreateIndex
CREATE INDEX "user_languages_userId_idx" ON "user_languages"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "religions_name_key" ON "religions"("name");

-- CreateIndex
CREATE INDEX "religions_active_idx" ON "religions"("active");

-- CreateIndex
CREATE INDEX "communities_religionId_idx" ON "communities"("religionId");

-- CreateIndex
CREATE INDEX "communities_active_idx" ON "communities"("active");

-- CreateIndex
CREATE UNIQUE INDEX "communities_religionId_name_key" ON "communities"("religionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- CreateIndex
CREATE INDEX "languages_active_idx" ON "languages"("active");

-- CreateIndex
CREATE INDEX "user_about_maritalStatus_idx" ON "user_about"("maritalStatus");

-- CreateIndex
CREATE INDEX "user_about_childStatus_idx" ON "user_about"("childStatus");

-- CreateIndex
CREATE INDEX "user_edu_work_highestEdu_idx" ON "user_edu_work"("highestEdu");

-- CreateIndex
CREATE INDEX "user_edu_work_degree_idx" ON "user_edu_work"("degree");

-- CreateIndex
CREATE INDEX "user_edu_work_graduationYear_idx" ON "user_edu_work"("graduationYear");

-- CreateIndex
CREATE INDEX "user_edu_work_professionId_idx" ON "user_edu_work"("professionId");

-- CreateIndex
CREATE INDEX "user_edu_work_employmentTypeId_idx" ON "user_edu_work"("employmentTypeId");

-- CreateIndex
CREATE INDEX "user_edu_work_experienceId_idx" ON "user_edu_work"("experienceId");

-- CreateIndex
CREATE INDEX "user_edu_work_ambitionId_idx" ON "user_edu_work"("ambitionId");

-- CreateIndex
CREATE INDEX "user_edu_work_salaryRangeId_idx" ON "user_edu_work"("salaryRangeId");

-- CreateIndex
CREATE UNIQUE INDEX "user_family_profiles_userId_key" ON "user_family_profiles"("userId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyStatusId_idx" ON "user_family_profiles"("familyStatusId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyTypeId_idx" ON "user_family_profiles"("familyTypeId");

-- CreateIndex
CREATE INDEX "user_family_profiles_fatherOccupationId_idx" ON "user_family_profiles"("fatherOccupationId");

-- CreateIndex
CREATE INDEX "user_family_profiles_motherOccupationId_idx" ON "user_family_profiles"("motherOccupationId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyHomeId_idx" ON "user_family_profiles"("familyHomeId");

-- CreateIndex
CREATE INDEX "user_family_profiles_nativePlaceId_idx" ON "user_family_profiles"("nativePlaceId");

-- CreateIndex
CREATE INDEX "user_family_profiles_familyIncomeId_idx" ON "user_family_profiles"("familyIncomeId");

-- CreateIndex
CREATE UNIQUE INDEX "master_categories_code_key" ON "master_categories"("code");

-- CreateIndex
CREATE INDEX "master_values_categoryId_idx" ON "master_values"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "professions_name_key" ON "professions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_name_key" ON "employment_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "experiences_title_key" ON "experiences"("title");

-- CreateIndex
CREATE UNIQUE INDEX "ambitions_title_key" ON "ambitions"("title");

-- CreateIndex
CREATE UNIQUE INDEX "salary_ranges_title_key" ON "salary_ranges"("title");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "user_skills_userId_idx" ON "user_skills"("userId");

-- CreateIndex
CREATE INDEX "user_skills_skillId_idx" ON "user_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

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
CREATE INDEX "user_prompts_userId_idx" ON "user_prompts"("userId");

-- CreateIndex
CREATE INDEX "user_prompts_promptId_idx" ON "user_prompts"("promptId");

-- CreateIndex
CREATE UNIQUE INDEX "user_prompts_userId_promptId_key" ON "user_prompts"("userId", "promptId");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_categories_name_key" ON "prompt_categories"("name");

-- CreateIndex
CREATE INDEX "prompts_categoryId_idx" ON "prompts"("categoryId");

-- CreateIndex
CREATE INDEX "prompts_active_idx" ON "prompts"("active");

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
CREATE INDEX "user_boosts_user_id_idx" ON "user_boosts"("user_id");

-- CreateIndex
CREATE INDEX "user_boosts_boost_option_id_idx" ON "user_boosts"("boost_option_id");

-- CreateIndex
CREATE INDEX "boost_usages_user_id_idx" ON "boost_usages"("user_id");

-- CreateIndex
CREATE INDEX "boost_usages_user_boost_id_idx" ON "boost_usages"("user_boost_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_boost_stats_user_id_key" ON "user_boost_stats"("user_id");

-- CreateIndex
CREATE INDEX "boost_events_boost_usage_id_idx" ON "boost_events"("boost_usage_id");

-- CreateIndex
CREATE INDEX "boost_events_user_id_idx" ON "boost_events"("user_id");

-- CreateIndex
CREATE INDEX "boost_events_actor_id_idx" ON "boost_events"("actor_id");

-- CreateIndex
CREATE INDEX "boost_events_created_at_idx" ON "boost_events"("created_at");

-- CreateIndex
CREATE INDEX "BoostPurchase_userId_idx" ON "BoostPurchase"("userId");

-- CreateIndex
CREATE INDEX "BoostPurchase_paymentId_idx" ON "BoostPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "BoostTransaction_userId_idx" ON "BoostTransaction"("userId");

-- CreateIndex
CREATE INDEX "BoostTransaction_type_idx" ON "BoostTransaction"("type");

-- CreateIndex
CREATE UNIQUE INDEX "package_name_key" ON "package"("name");

-- CreateIndex
CREATE UNIQUE INDEX "package_slug_key" ON "package"("slug");

-- CreateIndex
CREATE INDEX "plan_prices_packageId_idx" ON "plan_prices"("packageId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_prices_packageId_billingCycle_key" ON "plan_prices"("packageId", "billingCycle");

-- CreateIndex
CREATE INDEX "plan_limits_packageId_idx" ON "plan_limits"("packageId");

-- CreateIndex
CREATE INDEX "plan_limits_featureId_idx" ON "plan_limits"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "plan_limits_packageId_featureId_key" ON "plan_limits"("packageId", "featureId");

-- CreateIndex
CREATE INDEX "user_packages_user_id_idx" ON "user_packages"("user_id");

-- CreateIndex
CREATE INDEX "user_packages_packageId_idx" ON "user_packages"("packageId");

-- CreateIndex
CREATE INDEX "user_packages_status_idx" ON "user_packages"("status");

-- CreateIndex
CREATE INDEX "user_packages_endDate_idx" ON "user_packages"("endDate");

-- CreateIndex
CREATE INDEX "user_plan_usage_userId_idx" ON "user_plan_usage"("userId");

-- CreateIndex
CREATE INDEX "user_plan_usage_featureId_idx" ON "user_plan_usage"("featureId");

-- CreateIndex
CREATE UNIQUE INDEX "user_plan_usage_userId_featureId_key" ON "user_plan_usage"("userId", "featureId");

-- CreateIndex
CREATE INDEX "UserRose_senderId_idx" ON "UserRose"("senderId");

-- CreateIndex
CREATE INDEX "UserRose_receiverId_idx" ON "UserRose"("receiverId");

-- CreateIndex
CREATE INDEX "UserRose_senderId_receiverId_idx" ON "UserRose"("senderId", "receiverId");

-- CreateIndex
CREATE INDEX "UserRose_receiverId_senderId_isUnlocked_expiresAt_idx" ON "UserRose"("receiverId", "senderId", "isUnlocked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoseBalance_userId_key" ON "UserRoseBalance"("userId");

-- CreateIndex
CREATE INDEX "RosePurchase_userId_idx" ON "RosePurchase"("userId");

-- CreateIndex
CREATE INDEX "RosePurchase_paymentId_idx" ON "RosePurchase"("paymentId");

-- CreateIndex
CREATE INDEX "RoseTransaction_userId_idx" ON "RoseTransaction"("userId");

-- CreateIndex
CREATE INDEX "RoseTransaction_type_idx" ON "RoseTransaction"("type");

-- CreateIndex
CREATE INDEX "UserCompliment_senderId_idx" ON "UserCompliment"("senderId");

-- CreateIndex
CREATE INDEX "UserCompliment_receiverId_status_idx" ON "UserCompliment"("receiverId", "status");

-- CreateIndex
CREATE INDEX "UserCompliment_senderId_createdAt_idx" ON "UserCompliment"("senderId", "createdAt");

-- CreateIndex
CREATE INDEX "UserCompliment_receiverId_createdAt_idx" ON "UserCompliment"("receiverId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_compliment_balance_userId_key" ON "user_compliment_balance"("userId");

-- CreateIndex
CREATE INDEX "ComplimentPurchase_userId_idx" ON "ComplimentPurchase"("userId");

-- CreateIndex
CREATE INDEX "ComplimentPurchase_paymentId_idx" ON "ComplimentPurchase"("paymentId");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_userId_idx" ON "ComplimentTransaction"("userId");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_type_idx" ON "ComplimentTransaction"("type");

-- CreateIndex
CREATE INDEX "ComplimentTransaction_userId_createdAt_idx" ON "ComplimentTransaction"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGift_walletTransactionId_key" ON "UserGift"("walletTransactionId");

-- CreateIndex
CREATE INDEX "UserGift_receiverId_idx" ON "UserGift"("receiverId");

-- CreateIndex
CREATE INDEX "UserGift_senderId_idx" ON "UserGift"("senderId");

-- CreateIndex
CREATE INDEX "UserGift_giftId_idx" ON "UserGift"("giftId");

-- CreateIndex
CREATE INDEX "UserGift_receiverId_senderId_isUnlocked_expiresAt_idx" ON "UserGift"("receiverId", "senderId", "isUnlocked", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_payment_id_key" ON "Payment"("payment_id");

-- CreateIndex
CREATE INDEX "Notification_receiver_id_idx" ON "Notification"("receiver_id");

-- CreateIndex
CREATE INDEX "Notification_sender_id_idx" ON "Notification"("sender_id");

-- CreateIndex
CREATE INDEX "Notification_receiver_id_is_read_idx" ON "Notification"("receiver_id", "is_read");

-- CreateIndex
CREATE INDEX "DatePlanOption_type_isActive_idx" ON "DatePlanOption"("type", "isActive");

-- CreateIndex
CREATE INDEX "DatePlan_userId_idx" ON "DatePlan"("userId");

-- CreateIndex
CREATE INDEX "DatePlan_activityId_idx" ON "DatePlan"("activityId");

-- CreateIndex
CREATE INDEX "DatePlan_status_idx" ON "DatePlan"("status");

-- CreateIndex
CREATE INDEX "DatePlan_createdAt_idx" ON "DatePlan"("createdAt");

-- CreateIndex
CREATE INDEX "DatePlanVibe_vibeId_idx" ON "DatePlanVibe"("vibeId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanVibe_planId_vibeId_key" ON "DatePlanVibe"("planId", "vibeId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_planId_idx" ON "DatePlanRequest"("planId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_requesterId_idx" ON "DatePlanRequest"("requesterId");

-- CreateIndex
CREATE INDEX "DatePlanRequest_status_idx" ON "DatePlanRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanRequest_planId_requesterId_key" ON "DatePlanRequest"("planId", "requesterId");

-- CreateIndex
CREATE INDEX "DatePlanSkip_userId_idx" ON "DatePlanSkip"("userId");

-- CreateIndex
CREATE INDEX "DatePlanSkip_planId_idx" ON "DatePlanSkip"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanSkip_userId_planId_key" ON "DatePlanSkip"("userId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "DateConfirmed_planId_key" ON "DateConfirmed"("planId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_planId_idx" ON "DatePlanFeedback"("planId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_reviewerId_idx" ON "DatePlanFeedback"("reviewerId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_metUserId_idx" ON "DatePlanFeedback"("metUserId");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_attendanceStatus_idx" ON "DatePlanFeedback"("attendanceStatus");

-- CreateIndex
CREATE INDEX "DatePlanFeedback_createdAt_idx" ON "DatePlanFeedback"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanFeedback_planId_reviewerId_key" ON "DatePlanFeedback"("planId", "reviewerId");

-- CreateIndex
CREATE INDEX "DatePlanFeedbackTag_tag_idx" ON "DatePlanFeedbackTag"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanFeedbackTag_feedbackId_tag_key" ON "DatePlanFeedbackTag"("feedbackId", "tag");

-- CreateIndex
CREATE INDEX "DatePlanReport_planId_idx" ON "DatePlanReport"("planId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reporterId_idx" ON "DatePlanReport"("reporterId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reportedUserId_idx" ON "DatePlanReport"("reportedUserId");

-- CreateIndex
CREATE INDEX "DatePlanReport_reason_idx" ON "DatePlanReport"("reason");

-- CreateIndex
CREATE INDEX "DatePlanReport_status_idx" ON "DatePlanReport"("status");

-- CreateIndex
CREATE INDEX "DatePlanReport_createdAt_idx" ON "DatePlanReport"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DatePlanUserStats_userId_key" ON "DatePlanUserStats"("userId");

-- CreateIndex
CREATE INDEX "Conversation_updatedAt_idx" ON "Conversation"("updatedAt");

-- CreateIndex
CREATE INDEX "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key" ON "ConversationParticipant"("conversationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_roseId_key" ON "ChatMessage"("roseId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_complimentId_key" ON "ChatMessage"("complimentId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_giftId_key" ON "ChatMessage"("giftId");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_senderId_idx" ON "ChatMessage"("senderId");

-- CreateIndex
CREATE INDEX "ChatMessageDeletion_userId_idx" ON "ChatMessageDeletion"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessageDeletion_messageId_userId_key" ON "ChatMessageDeletion"("messageId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_city_idx" ON "Event"("city");

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_currentStep_idx" ON "Event"("currentStep");

-- CreateIndex
CREATE INDEX "Event_eventPartnerId_idx" ON "Event"("eventPartnerId");

-- CreateIndex
CREATE INDEX "EventFAQ_eventId_idx" ON "EventFAQ"("eventId");

-- CreateIndex
CREATE INDEX "EventFeatureTag_eventId_idx" ON "EventFeatureTag"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_bookingNumber_key" ON "EventBooking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EventBooking_paymentId_key" ON "EventBooking"("paymentId");

-- CreateIndex
CREATE INDEX "EventBooking_userId_idx" ON "EventBooking"("userId");

-- CreateIndex
CREATE INDEX "EventBooking_eventId_idx" ON "EventBooking"("eventId");

-- CreateIndex
CREATE INDEX "EventBooking_status_idx" ON "EventBooking"("status");

-- CreateIndex
CREATE INDEX "EventBooking_bookingNumber_idx" ON "EventBooking"("bookingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "EventBookingTicket_ticketId_key" ON "EventBookingTicket"("ticketId");

-- CreateIndex
CREATE INDEX "EventBookingTicket_bookingId_idx" ON "EventBookingTicket"("bookingId");

-- CreateIndex
CREATE INDEX "EventBookingTicket_ticketType_idx" ON "EventBookingTicket"("ticketType");

-- CreateIndex
CREATE INDEX "EventBookingTicket_status_idx" ON "EventBookingTicket"("status");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_idx" ON "WalletTransaction"("walletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_type_idx" ON "WalletTransaction"("type");

-- CreateIndex
CREATE INDEX "WalletTransaction_createdAt_idx" ON "WalletTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_userId_key" ON "waitlists"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_waitlistNumber_key" ON "waitlists"("waitlistNumber");

-- CreateIndex
CREATE UNIQUE INDEX "waitlists_paymentId_key" ON "waitlists"("paymentId");

-- CreateIndex
CREATE INDEX "waitlists_paymentStatus_idx" ON "waitlists"("paymentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "gift_categories_name_key" ON "gift_categories"("name");

-- CreateIndex
CREATE INDEX "gifts_categoryId_idx" ON "gifts"("categoryId");

-- CreateIndex
CREATE INDEX "gifts_name_idx" ON "gifts"("name");

-- CreateIndex
CREATE UNIQUE INDEX "compliment_categories_name_key" ON "compliment_categories"("name");

-- CreateIndex
CREATE INDEX "compliment_ideas_categoryId_sortOrder_idx" ON "compliment_ideas"("categoryId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_phone_key" ON "employees"("phone");

-- CreateIndex
CREATE INDEX "employees_roleId_idx" ON "employees"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_roles_roleName_key" ON "employee_roles"("roleName");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_module_key" ON "RolePermission"("roleId", "module");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_email_key" ON "event_partners"("email");

-- CreateIndex
CREATE UNIQUE INDEX "event_partners_gstNumber_key" ON "event_partners"("gstNumber");

-- CreateIndex
CREATE INDEX "event_partners_businessName_idx" ON "event_partners"("businessName");

-- CreateIndex
CREATE INDEX "event_partners_city_idx" ON "event_partners"("city");

-- CreateIndex
CREATE INDEX "event_partners_state_idx" ON "event_partners"("state");

-- CreateIndex
CREATE INDEX "event_partners_status_idx" ON "event_partners"("status");

-- CreateIndex
CREATE INDEX "store_info_itemType_isActive_idx" ON "store_info"("itemType", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "store_features_feature_key" ON "store_features"("feature");

-- CreateIndex
CREATE INDEX "store_features_feature_idx" ON "store_features"("feature");

-- CreateIndex
CREATE INDEX "store_packs_itemType_isActive_idx" ON "store_packs"("itemType", "isActive");

-- CreateIndex
CREATE INDEX "UserCompatibility_userId_score_idx" ON "UserCompatibility"("userId", "score");

-- CreateIndex
CREATE INDEX "UserCompatibility_userId_targetUserId_idx" ON "UserCompatibility"("userId", "targetUserId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompatibility_userId_targetUserId_key" ON "UserCompatibility"("userId", "targetUserId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "IntentionOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferral" ADD CONSTRAINT "UserReferral_referredUserId_fkey" FOREIGN KEY ("referredUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserReferralStats" ADD CONSTRAINT "UserReferralStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_languages" ADD CONSTRAINT "user_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_religionId_fkey" FOREIGN KEY ("religionId") REFERENCES "religions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_about" ADD CONSTRAINT "user_about_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_professionId_fkey" FOREIGN KEY ("professionId") REFERENCES "professions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_employmentTypeId_fkey" FOREIGN KEY ("employmentTypeId") REFERENCES "employment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_ambitionId_fkey" FOREIGN KEY ("ambitionId") REFERENCES "ambitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_salaryRangeId_fkey" FOREIGN KEY ("salaryRangeId") REFERENCES "salary_ranges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_edu_work" ADD CONSTRAINT "user_edu_work_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyStatusId_fkey" FOREIGN KEY ("familyStatusId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyTypeId_fkey" FOREIGN KEY ("familyTypeId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_fatherOccupationId_fkey" FOREIGN KEY ("fatherOccupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_fatherOrganisationId_fkey" FOREIGN KEY ("fatherOrganisationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_motherOccupationId_fkey" FOREIGN KEY ("motherOccupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_motherOrganisationId_fkey" FOREIGN KEY ("motherOrganisationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyHomeId_fkey" FOREIGN KEY ("familyHomeId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_nativePlaceId_fkey" FOREIGN KEY ("nativePlaceId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_family_profiles" ADD CONSTRAINT "user_family_profiles_familyIncomeId_fkey" FOREIGN KEY ("familyIncomeId") REFERENCES "family_income"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_familyProfileId_fkey" FOREIGN KEY ("familyProfileId") REFERENCES "user_family_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_siblingTypeId_fkey" FOREIGN KEY ("siblingTypeId") REFERENCES "master_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_maritalId_fkey" FOREIGN KEY ("maritalId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_siblings" ADD CONSTRAINT "user_siblings_occupationId_fkey" FOREIGN KEY ("occupationId") REFERENCES "master_values"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_values" ADD CONSTRAINT "master_values_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "master_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_prompts" ADD CONSTRAINT "user_prompts_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "prompts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "prompt_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiperId_fkey" FOREIGN KEY ("swiperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentionOption" ADD CONSTRAINT "IntentionOption_intentionId_fkey" FOREIGN KEY ("intentionId") REFERENCES "Intention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_options" ADD CONSTRAINT "boost_options_boost_id_fkey" FOREIGN KEY ("boost_id") REFERENCES "boosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boostId_fkey" FOREIGN KEY ("boostId") REFERENCES "boosts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boosts" ADD CONSTRAINT "user_boosts_boost_option_id_fkey" FOREIGN KEY ("boost_option_id") REFERENCES "boost_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_usages" ADD CONSTRAINT "boost_usages_user_boost_id_fkey" FOREIGN KEY ("user_boost_id") REFERENCES "user_boosts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_usages" ADD CONSTRAINT "boost_usages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_boost_stats" ADD CONSTRAINT "user_boost_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_boost_usage_id_fkey" FOREIGN KEY ("boost_usage_id") REFERENCES "boost_usages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boost_events" ADD CONSTRAINT "boost_events_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostPurchase" ADD CONSTRAINT "BoostPurchase_boostOptionId_fkey" FOREIGN KEY ("boostOptionId") REFERENCES "boost_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostTransaction" ADD CONSTRAINT "BoostTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoostTransaction" ADD CONSTRAINT "BoostTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "BoostPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_limits" ADD CONSTRAINT "plan_limits_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "package_feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_currentPackageId_fkey" FOREIGN KEY ("currentPackageId") REFERENCES "package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_packages" ADD CONSTRAINT "user_packages_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "plan_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_usage" ADD CONSTRAINT "user_plan_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plan_usage" ADD CONSTRAINT "user_plan_usage_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "package_feature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRose" ADD CONSTRAINT "UserRose_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRose" ADD CONSTRAINT "UserRose_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoseBalance" ADD CONSTRAINT "UserRoseBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosePurchase" ADD CONSTRAINT "RosePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseTransaction" ADD CONSTRAINT "RoseTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoseTransaction" ADD CONSTRAINT "RoseTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "RosePurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "compliment_ideas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompliment" ADD CONSTRAINT "UserCompliment_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_compliment_balance" ADD CONSTRAINT "user_compliment_balance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentPurchase" ADD CONSTRAINT "ComplimentPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentTransaction" ADD CONSTRAINT "ComplimentTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentTransaction" ADD CONSTRAINT "ComplimentTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "ComplimentPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGift" ADD CONSTRAINT "UserGift_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_quickTitleId_fkey" FOREIGN KEY ("quickTitleId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_whoPaysId_fkey" FOREIGN KEY ("whoPaysId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_joinRequestGenderId_fkey" FOREIGN KEY ("joinRequestGenderId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlan" ADD CONSTRAINT "DatePlan_visibilityId_fkey" FOREIGN KEY ("visibilityId") REFERENCES "DatePlanOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanVibe" ADD CONSTRAINT "DatePlanVibe_vibeId_fkey" FOREIGN KEY ("vibeId") REFERENCES "DatePlanOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanRequest" ADD CONSTRAINT "DatePlanRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanSkip" ADD CONSTRAINT "DatePlanSkip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanSkip" ADD CONSTRAINT "DatePlanSkip_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateConfirmed" ADD CONSTRAINT "DateConfirmed_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateConfirmed" ADD CONSTRAINT "DateConfirmed_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DateConfirmed" ADD CONSTRAINT "DateConfirmed_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedback" ADD CONSTRAINT "DatePlanFeedback_metUserId_fkey" FOREIGN KEY ("metUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanFeedbackTag" ADD CONSTRAINT "DatePlanFeedbackTag_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "DatePlanFeedback"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_planId_fkey" FOREIGN KEY ("planId") REFERENCES "DatePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanReport" ADD CONSTRAINT "DatePlanReport_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatePlanUserStats" ADD CONSTRAINT "DatePlanUserStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("payment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_walletTransactionId_fkey" FOREIGN KEY ("walletTransactionId") REFERENCES "WalletTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_purchases" ADD CONSTRAINT "date_plan_purchases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_transactions" ADD CONSTRAINT "date_plan_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "date_plan_transactions" ADD CONSTRAINT "date_plan_transactions_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "date_plan_purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roseId_fkey" FOREIGN KEY ("roseId") REFERENCES "UserRose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_complimentId_fkey" FOREIGN KEY ("complimentId") REFERENCES "UserCompliment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "UserGift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageDeletion" ADD CONSTRAINT "ChatMessageDeletion_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ChatMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessageDeletion" ADD CONSTRAINT "ChatMessageDeletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_eventPartnerId_fkey" FOREIGN KEY ("eventPartnerId") REFERENCES "event_partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventGallery" ADD CONSTRAINT "EventGallery_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAmenity" ADD CONSTRAINT "EventAmenity_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventItinerary" ADD CONSTRAINT "EventItinerary_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventWhyCome" ADD CONSTRAINT "EventWhyCome_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSafety" ADD CONSTRAINT "EventSafety_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFAQ" ADD CONSTRAINT "EventFAQ_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventFeatureTag" ADD CONSTRAINT "EventFeatureTag_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBooking" ADD CONSTRAINT "EventBooking_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBookingTicket" ADD CONSTRAINT "EventBookingTicket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "EventBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waitlists" ADD CONSTRAINT "waitlists_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "gift_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliment_ideas" ADD CONSTRAINT "compliment_ideas_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "compliment_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "employee_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "employee_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
