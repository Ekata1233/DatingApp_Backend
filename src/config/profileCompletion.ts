// profile-completion.constants.ts

export const PROFILE_WEIGHTS = {
  TOTAL_SCORE: 100,

  PHONE_VERIFICATION: 5,

  BASIC_INFO: {
    TOTAL: 13,

    FULL_NAME: 3,
    EMAIL: 2,
    BIRTH_DATE: 2,
    HEIGHT: 2,
    GENDER: 2,
    GENDER_OPTION: 2,
  },

/////////////////////------------------18----------------------///////////////////////////
  
  PROFILE: {
    TOTAL: 15,

    INTENTION: 2,
    RELIGION: 1,
    COMMUNITY: 2,
    INTERESTED_IN: 2,
    SEXUAL_ORIENTATION: 2,
    COUNTRY: 1,
    STATE: 1,
    CITY: 1,
    LOCATION_COORDINATES: 2,
    LANGUAGES: 1,
  },

  EDUCATION_WORK: {
    TOTAL: 12,

    HIGHEST_EDUCATION: 1,
    DEGREE: 1,
    COLLEGE: 1,
    YEAR_OF_PASSING: 1,
    PROFESSION: 2,
    COMPANY: 1,
    EMPLOYMENT_TYPE: 1,
    EXPERIENCE: 1,
    AMBITION: 1,
    SALARY_RANGE: 1,
    BIG_DREAMS: 1,
  },

  FAMILY: {
    TOTAL: 10,

    FAMILY_STATUS: 1,
    FAMILY_TYPE: 1,
    FATHER_OCCUPATION: 1,
    FATHER_ORGANIZATION: 1,
    MOTHER_OCCUPATION: 1,
    MOTHER_ORGANIZATION: 1,
    SIBLING_RELATION: 1,
    SIBLING_OCCUPATION: 1,
    FAMILY_CITY: 1,
    FAMILY_INCOME: 1,
  },

  INTERESTS: {
    TOTAL: 10,

    QUESTIONS_COUNT: 6,

    ONE: 2,
    TWO: 4,
    THREE: 6,
    FOUR: 8,
    FIVE: 9,
    SIX: 10,
  },

  LIFESTYLE: {
    TOTAL: 5,

    QUESTIONS_COUNT: 5,

    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  },

  PROMPTS: {
    TOTAL: 5,

    ONE: 2,
    TWO: 4,
    THREE: 5,
  },

  PHOTOS: {
    TOTAL: 15,

    ONE_PHOTO: 3,
    TWO_PHOTOS: 3,
    THREE_PHOTOS: 3,
    FOUR_PHOTOS: 3,
    FIVE_OR_MORE: 3,
  },

  BIO: {
    TOTAL: 10,

    MIN_20_CHARS: 3,
    MIN_50_CHARS: 6,
    MIN_100_CHARS: 10,
  },
} as const;