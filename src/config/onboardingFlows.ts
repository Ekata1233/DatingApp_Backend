import { QuestionScreen } from "@prisma/client";

export const ONBOARDING_FLOWS = {
  DATE_TO_MARRY: [
    "LOOKING_FOR",
    "BASIC_INFO",
    "RELIGION", // step 3
    "ADDRESS",
    "ABOUT_YOURSELF",
    "EDUCATION",
    "WORK", // step 7
    "lIFESTYLE",
    "REAL_YOU",
    "THINGS_LOVE",
    "LATEST_PHOTOS",
    "MORE_ABOUT",
    "BIO"
  ],

  DATING: [
    "BASIC_INFO",
    "INTRESTED_IN",
    "LOOKING_FOR",
    "lIFESTYLE",
    "REAL_YOU",
    "THINGS_LOVE",
    "LATEST_PHOTOS",
    "MORE_ABOUT",
    "BIO",
    "RELIGION",
    "EDUCATION",
    "FAMILY_DETAILS"
  ],

  MATURE: [
    "LOOKING_FOR",
    "BASIC_INFO",
    "INTERESTED_IN",
    "RELIGION",
    "ADDRESS",
    "ABOUT_YOURSELF",
    "EDUCATION",
    "FINANCIAL_SITUATION",
    "lIFESTYLE",
    "HEALTH_WELLNESS",
    "INTEREST_HOBBIES",
    "DREAM_FUTUREPLANS",
    "LATEST_PHOTOS",
    "MORE_ABOUT",
    "BIO"
  ],
};


export const WELVORS_FLOWS =
  [
    "VERIFY_PHONE",
    "BASIC_INFO",
    "INTERESTED_IN",
    "LOOKING_FOR",
    "LIFESTYLE",
    "CAREER_AMBITION",
    "INTEREST",
    "PHOTOS",
    "STORY",
    "PROMPT",
    "LOCATION",
    "REVIEW_FINISH"
  ] as const;

  export const QUESTION_SCREEN_TO_ONBOARDING_STEP: Partial<
  Record<QuestionScreen, string>
> = {
  LIFESTYLE: "LIFESTYLE",

  REAL_U_MATTERS: "LIFESTYLE",
  HEALTH_WELLNESS: "LIFESTYLE",

  THINGS_U_LOVE: "INTEREST",
  INTEREST_HOBBY: "INTEREST",
  DREAM_PLAN: "INTEREST",
  NETWORKING_INTENT: "INTEREST",
};