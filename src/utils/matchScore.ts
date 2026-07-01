// =======================
// LEVEL MAPS
// =======================

import { Gender, GenderOption } from "@prisma/client";

const EDUCATION_LEVEL: Record<string, number> = {
  HIGH_SCHOOL: 1,
  ITI: 2,
  DIPLOMA: 3,
  UNDERGRADUATE: 4,
  BACHELOR: 5,
  MASTER: 6,
  DOCTORATE: 7,
};

const DRINK_LEVEL: Record<string, number> = {
  NOT_FOR_ME: 0,
  NEWLY_TEETOTAL: 1,
  SOBER_CURIOUS: 2,
  SPECIAL_OCCASIONS: 3,
  SOCIAL_WEEKEND: 4,
  MOST_NIGHTS: 5,
};

const SMOKE_LEVEL: Record<string, number> = {
  NON_SMOKER: 0,
  TRYING_TO_QUIT: 1,
  SOCIAL_SMOKER: 2,
  SMOKER_WITH_DRINKING: 3,
  SMOKER: 4,
};

const WORKOUT_LEVEL: Record<string, number> = {
  NEVER: 0,
  SOMETIMES: 1,
  OFTEN: 2,
  EVERY_DAY: 3,
};

const OCCUPATION_GROUP: Record<string, string> = {
  STUDENT: "education",
  INTERN: "education",

  EMPLOYED: "career",
  SELF_EMPLOYED: "career",
  FREELANCER: "career",
  ENTREPRENEUR: "career",
};

// =======================
// GENERIC SCORE
// =======================

export function scoreByDistance(
  myValue: number | undefined,
  otherValue: number | undefined,
  maxPoints: number
): number {

  if (myValue == null || otherValue == null)
    return 0;

  const diff = Math.abs(myValue - otherValue);

  switch (diff) {
    case 0:
      return maxPoints;

    case 1:
      return maxPoints * 0.8;

    case 2:
      return maxPoints * 0.5;

    case 3:
      return maxPoints * 0.25;

    default:
      return 0;
  }
}

// =======================
// EDUCATION
// =======================
export function educationScore(my?: string, other?: string) {

  return scoreByDistance(
    EDUCATION_LEVEL[my ?? ""],
    EDUCATION_LEVEL[other ?? ""],
    5
  );
}

// =======================
// DEGREE
// =======================
export function degreeScore(
  my?: string,
  other?: string
) {
  if (!my || !other) return 0;
  if (my.trim().toLowerCase() === other.trim().toLowerCase()) {
    return 2;
  }

  return 1;
}

// =======================
// GRADUATION YEAR
// =======================
export function graduationYearScore(
  my?: number,
  other?: number
) {
  if (my == null || other == null) {
    return 0;
  }

  const diff = Math.abs(my - other);

  if (diff === 0) return 3;
  if (diff <= 2) return 2;
  if (diff <= 5) return 1;

  return 0;
}
//=======================
// GENDER PREFERENCE
//=======================
export function genderPreferenceScore(
  myGender?: Gender,
  myInterestedIn?: Gender,
  otherGender?: Gender,
  otherInterestedIn?: Gender
) {
  if (
    !myGender ||
    !myInterestedIn ||
    !otherGender ||
    !otherInterestedIn
  ) {
    return 0;
  }

  const bothInterested =
    myInterestedIn === otherGender &&
    otherInterestedIn === myGender;

  return bothInterested ? 15 : 0;
}

// =======================
// SEXUAL ORIENTATION COMPATIBILITY
// =======================
export function orientationScore(
  myOrientation?: GenderOption,
  otherOrientation?: GenderOption
) {
  if (!myOrientation || !otherOrientation) {
    return 0;
  }

  if (myOrientation === otherOrientation) {
    return 10;
  }

  const compatible = [
    [GenderOption.STRAIGHT, GenderOption.BISEXUAL],
    [GenderOption.STRAIGHT, GenderOption.PANSEXUAL],

    [GenderOption.GAY, GenderOption.BISEXUAL],
    [GenderOption.GAY, GenderOption.PANSEXUAL],

    [GenderOption.LESBIAN, GenderOption.BISEXUAL],
    [GenderOption.LESBIAN, GenderOption.PANSEXUAL],

    [GenderOption.BISEXUAL, GenderOption.PANSEXUAL],
  ];

  const match = compatible.some(
    ([a, b]) =>
      (a === myOrientation && b === otherOrientation) ||
      (a === otherOrientation && b === myOrientation)
  );

  return match ? 7 : 2;
}

// =======================
// AGE SCORE
// =======================
export function ageScore(
  myDob?: Date,
  otherDob?: Date
) {

  if (!myDob || !otherDob) return 0;

  const age = (dob: Date) =>
    new Date().getFullYear() - dob.getFullYear();

  const diff = Math.abs(age(myDob) - age(otherDob));

  switch (true) {
    case diff === 0:
      return 10;

    case diff <= 2:
      return 9;

    case diff <= 4:
      return 7;

    case diff <= 6:
      return 5;

    case diff <= 10:
      return 3;

    default:
      return 1;
  }
}

// =======================
// HEIGHT SCORE
// =======================
export function heightScore(
  myHeight?: number,
  otherHeight?: number
) {

  if (
    myHeight == null ||
    otherHeight == null
  )
    return 0;

  const diff = Math.abs(myHeight - otherHeight);

  if (diff <= 5) return 5;

  if (diff <= 10) return 4;

  if (diff <= 15) return 3;

  if (diff <= 20) return 2;

  return 1;
}

// =======================
// COMPATIBLE_SIGNS 
// =======================
const COMPATIBLE_SIGNS = [
  ["ARIES", "LEO"],
  ["ARIES", "SAGITTARIUS"],

  ["TAURUS", "VIRGO"],
  ["TAURUS", "CAPRICORN"],

  ["GEMINI", "LIBRA"],
  ["GEMINI", "AQUARIUS"],

  ["CANCER", "SCORPIO"],
  ["CANCER", "PISCES"],

  ["LEO", "SAGITTARIUS"],

  ["VIRGO", "CAPRICORN"],

  ["LIBRA", "AQUARIUS"],

  ["SCORPIO", "PISCES"],
];

export function zodiacScore(
  my?: string,
  other?: string
) {
  if (!my || !other) return 0;

  if (my === other) return 2;

  const compatible = COMPATIBLE_SIGNS.some(
    ([a, b]) =>
      (a === my && b === other) ||
      (a === other && b === my)
  );

  return compatible ? 2 : 1;
}


// =======================
// DRINK
// =======================  
export function drinkScore(my?: string, other?: string) {

  const score = scoreByDistance(
    DRINK_LEVEL[my ?? ""],
    DRINK_LEVEL[other ?? ""],
    3
  );

  return score;
}

// =======================
// SMOKE
// =======================

export function smokeScore(my?: string, other?: string) {

  return scoreByDistance(
    SMOKE_LEVEL[my ?? ""],
    SMOKE_LEVEL[other ?? ""],
    3
  );
}

// =======================
// WORKOUT
// =======================

export function workoutScore(my?: string, other?: string) {

  return scoreByDistance(
    WORKOUT_LEVEL[my ?? ""],
    WORKOUT_LEVEL[other ?? ""],
    3
  );
}

// =======================
// OCCUPATION
// =======================

export function occupationScore(my?: string, other?: string) {

  if (!my || !other)
    return 0;

  if (my === other)
    return 3;

  if (
    OCCUPATION_GROUP[my] &&
    OCCUPATION_GROUP[my] === OCCUPATION_GROUP[other]
  )
    return 2;

  return 1;
}

// =======================
// COMMUNICATION STYLE
// =======================

export function communicationScore(my?: string, other?: string) {

  if (!my || !other)
    return 0;

  return my === other ? 5 : 2;
}

// =======================
// LOVE LANGUAGE
// =======================

export function loveLanguageScore(my?: string, other?: string) {

  if (!my || !other)
    return 0;

  return my === other ? 5 : 2;
}

// =======================
// DIET
// =======================

const DIET_COMPATIBILITY = [
  ["VEGETARIAN", "EGGETARIAN"],
  ["VEGETARIAN", "VEGAN"],
];

export function dietScore(my?: string, other?: string) {

  if (!my || !other)
    return 0;

  if (my === other)
    return 3;

  const compatible = DIET_COMPATIBILITY.some(pair =>
    pair.includes(my) && pair.includes(other)
  );

  return compatible ? 2 : 1;
}

// =======================
// PET
// =======================

const PET_GROUP: Record<string, string> = {
  DOG: "pet",
  CAT: "pet",
  FISH: "pet",
  BIRD: "pet",
  HAMSTER: "pet",
  RABBIT: "pet",
  TURTLE: "pet",
  REPTILE: "pet",
  AMPHIBIAN: "pet",

  PET_FREE: "none",

  WANT_A_PET: "future",
  DONT_HAVE_BUT_LOVE: "future",
};

export function petScore(my?: string, other?: string) {

  if (!my || !other)
    return 0;

  if (my === other)
    return 3;

  if (PET_GROUP[my] === PET_GROUP[other])
    return 2;

  return 1;
}

// =======================
// INTERESTS
// =======================

export function interestScore(
  myInterests: string[] = [],
  otherInterests: string[] = []
) {

  if (!myInterests.length || !otherInterests.length)
    return 0;

  const common = myInterests.filter(i =>
    otherInterests.includes(i)
  );

  return Math.min((common.length / 10) * 15, 15);
}

// =======================
// LANGUAGE
// =======================

export function languageScore(
  myLanguages: string[] = [],
  otherLanguages: string[] = []
) {

  if (!myLanguages.length || !otherLanguages.length)
    return 0;

  const common = myLanguages.filter(l =>
    otherLanguages.includes(l)
  );

  return Math.min((common.length / myLanguages.length) * 5, 5);
}

// =======================
// BIO SCORE
// =======================
export function bioScore(
  myBio?: string,
  otherBio?: string
) {
  if (!myBio || !otherBio)
    return 0;

  const myLength = myBio.trim().length;
  const otherLength = otherBio.trim().length;

  if (myLength >= 100 && otherLength >= 100)
    return 3;

  if (myLength >= 50 && otherLength >= 50)
    return 2;

  return 1;
}

// =======================
// PHOTO SCORE
// =======================
export function photoScore(
  myPhotos: number,
  otherPhotos: number
) {
  const minPhotos = Math.min(myPhotos, otherPhotos);

  if (minPhotos >= 5) return 5;

  if (minPhotos >= 4) return 4;

  if (minPhotos >= 3) return 3;

  if (minPhotos >= 2) return 2;

  if (minPhotos >= 1) return 1;

  return 0;
}

// =======================
// PROFILE COMPLETENESS SCORE
// =======================
export function profileCompletenessScore(user: any) {
  let score = 0;

  // if (user.bio?.trim()) score += 2;

  if (user.photos?.length >= 5) score += 3;

  return score;
}

/**
 * Converts an array of answers into:
 * {
 *   DRINKING: "SOCIAL_WEEKEND",
 *   SMOKING: "NEVER",
 *   ...
 * }
 */
export function buildAnswerMap(answers: any[]) {
  return answers.reduce((map, answer) => {
    map[answer.question.key] = answer.option.value;
    return map;
  }, {} as Record<string, string>);
}