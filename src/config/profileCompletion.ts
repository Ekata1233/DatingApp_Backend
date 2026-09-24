// profile-completion.constants.ts

export const PROFILE_WEIGHTS = {
  TOTAL_SCORE: 100,

  PHOTOS: {
    TOTAL: 20,

    ONE_PHOTO: 7,
    TWO_PHOTOS: 5,
    THREE_PHOTOS: 4,
    FOUR_PHOTOS: 2,
    FIVE_PHOTOS: 1,
    SIX_PHOTOS: 1
  },

  VIDEO: {
    TOTAL: 5,

    VIDEO: 5
  },

  BIO: {
    TOTAL: 5,

    MIN_20_CHARS: 3,
    MIN_50_CHARS: 4,
    MIN_100_CHARS: 5,
  },

  INTENTION: {
    TOTAL: 5,

    INTENTION: 5
  },

  BASIC_INFO: {
    TOTAL: 17,

    FULL_NAME: 1,
    EMAIL: 2,
    BIRTH_DATE: 2,
    HEIGHT: 2,
    GENDER: 2,
    GENDER_OPTION: 1,
    RELIGION: 2,
    COMMUNITY: 2,
    MARITAL_STATUS: 1,
    ZODIAC: 1,
    LANGUAGES: 1,
  },

  INTERESTED_IN: {
    TOTAL: 7,

    INTERESTED_IN: 5,
    SEXUAL_ORIENTATION: 2,

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

  EDUCATION_WORK: {
    TOTAL: 11,

    HIGHEST_EDUCATION: 1,
    DEGREE: 1,
    COLLEGE: 1,
    YEAR_OF_PASSING: 1,
    PROFESSION: 1,
    COMPANY: 1,
    EMPLOYMENT_TYPE: 1,
    EXPERIENCE: 1,
    AMBITION: 1,
    SALARY_RANGE: 1,
    BIG_DREAMS: 1,
  },

  FAMILY: {
    TOTAL: 9,

    FAMILY_STATUS: 1,
    FAMILY_TYPE: 1,
    FATHER_OCCUPATION: 1,
    FATHER_ORGANIZATION: 1,
    MOTHER_OCCUPATION: 1,
    MOTHER_ORGANIZATION: 1,
    SIBLING_RELATION: 1,
    FAMILY_CITY: 1,
    FAMILY_INCOME: 1,
  },

  INTERESTS: {
    TOTAL: 6,

    QUESTIONS_COUNT: 6,

    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
    SIX: 6,
  },

  PROMPTS: {
    TOTAL: 8,

    ONE: 3,
    TWO: 3,
    THREE: 2,
  },

  LOCATION: {
    TOTAL: 2,

    LOCATION_COORDINATES: 2,

  }


} as const;