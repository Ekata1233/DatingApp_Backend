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

export const OCCUPATION_GROUP: Record<string, string> = {
  // Education
  student: "education",
  intern: "education",
  trade_school: "education",

  // Career
  employed: "career",
  self_employed: "career",
  freelancer: "career",
  entrepreneur: "career",
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
    SMOKE_LEVEL[my?.toUpperCase() ?? ""],
    SMOKE_LEVEL[other?.toUpperCase() ?? ""],
    3
  );
}

// =======================
// WORKOUT
// =======================
export function workoutScore(my?: string, other?: string) {
  return scoreByDistance(
    WORKOUT_LEVEL[my?.toUpperCase() ?? ""],
    WORKOUT_LEVEL[other?.toUpperCase() ?? ""],
    3
  );
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
  ALL_THE_PETS: "pet",
  OTHER: "pet",
  PET_FREE: "none",
  ALLERGIC_TO_PETS: "none",
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
// COMMUNICATION STYLE
// =======================
const COMMUNICATION_GROUP: Record<string, string> = {
  stay_on_whatsapp_all_day: "text",
  big_time_texter: "text",
  slow_to_answer_on_whatsapp: "text",
  bad_texter: "text",

  phone_caller: "call",
  video_chatter: "call",

  better_in_person: "in_person",
};
export function communicationScore(my?: string, other?: string) {
  if (!my || !other) return 0;
  // Exact same preference
  if (my === other) {
    return 5;
  }
  const myGroup = COMMUNICATION_GROUP[my];
  const otherGroup = COMMUNICATION_GROUP[other];
  // Same communication style (e.g. both are texters)
  if (myGroup && myGroup === otherGroup) {
    return 4;
  }
  // Text ↔ Call are somewhat compatible
  const compatibleGroups = ["text", "call"];

  if (
    compatibleGroups.includes(myGroup) &&
    compatibleGroups.includes(otherGroup)
  ) {
    return 2.5;
  }
  // Better in person doesn't match well with text/call preferences
  return 1;
}

// =======================
// LOVE LANGUAGE
// =======================
const LOVE_LANGUAGE_GROUP: Record<string, string> = {
  words_of_affirmation: "emotional",
  thoughtful_gestures: "emotional",
  quality_time: "presence",
  physical_touch: "physical",
  gifts: "gifts",
};
export function loveLanguageScore(my?: string, other?: string) {
  if (!my || !other) return 0;
  // Exact same love language
  if (my === other) {
    return 5;
  }

  const myGroup = LOVE_LANGUAGE_GROUP[my];
  const otherGroup = LOVE_LANGUAGE_GROUP[other];

  // Similar love languages
  if (myGroup === otherGroup) {
    return 4;
  }
  // Presence and emotional are fairly compatible
  const compatibleGroups = [
    ["emotional", "presence"],
    ["presence", "emotional"],
  ];
  const isCompatible = compatibleGroups.some(
    ([a, b]) => myGroup === a && otherGroup === b
  );
  if (isCompatible) {
    return 3;
  }
  // Everything else has low compatibility
  return 1;
}

// =======================
// OCCUPATION
// =======================
export function occupationScore(my?: string, other?: string) {
  if (!my || !other) return 0;

  const myOccupation = my.toLowerCase();
  const otherOccupation = other.toLowerCase();
  // Exact occupation
  if (myOccupation === otherOccupation) {
    return 3;
  }
  const myGroup = OCCUPATION_GROUP[myOccupation];
  const otherGroup = OCCUPATION_GROUP[otherOccupation];

  // Same stage (education or career)
  if (myGroup && myGroup === otherGroup) {
    return 2;
  }
  // Different stages
  return 1;
}

// =======================
// COMPATIBLE_SIGNS 
// =======================
const COMPATIBLE_SIGNS: Record<string, string[]> = {
  aries: ["leo", "sagittarius", "gemini", "aquarius"],

  taurus: ["virgo", "capricorn", "cancer", "pisces"],

  gemini: ["libra", "aquarius", "aries", "leo"],

  cancer: ["scorpio", "pisces", "taurus", "virgo"],

  leo: ["aries", "sagittarius", "gemini", "libra"],

  virgo: ["taurus", "capricorn", "cancer", "scorpio"],

  libra: ["gemini", "aquarius", "leo", "sagittarius"],

  scorpio: ["cancer", "pisces", "virgo", "capricorn"],

  sagittarius: ["aries", "leo", "libra", "aquarius"],

  capricorn: ["taurus", "virgo", "scorpio", "pisces"],

  aquarius: ["gemini", "libra", "aries", "sagittarius"],

  pisces: ["cancer", "scorpio", "taurus", "capricorn"],
};
export function zodiacScore(my?: string, other?: string) {
  if (!my || !other) return 0;
  const mySign = my.toLowerCase();
  const otherSign = other.toLowerCase();
  // Same sign
  if (mySign === otherSign) {
    return 2;
  }
  // Traditionally compatible
  if (COMPATIBLE_SIGNS[mySign]?.includes(otherSign)) {
    return 2;
  }
  // Everything else
  return 1;
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
// CREATIVITY SCORE
// =======================
export function creativityScore(
  my: string[] = [],
  other: string[] = []
): number {
  console.log("my", my);
  console.log("other", other);
  if (!my.length || !other.length) return 0;

  const mySet = new Set(my.map(i => i.toLowerCase()));
  const otherSet = new Set(other.map(i => i.toLowerCase()));

  let common = 0;

  for (const interest of mySet) {
    if (otherSet.has(interest)) {
      common++;
    }
  }

  // Score out of 5
  if (common >= 5) return 5;
  if (common === 4) return 4.5;
  if (common === 3) return 4;
  if (common === 2) return 3;
  if (common === 1) return 2;

  return 0;
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

export function getAnswerValues(answers: any[], key: string): string[] {
  return answers
    .filter((a) => a.question.key === key)
    .map((a) => a.option.value);
}

export function multiSelectScore(
  my: string[] = [],
  other: string[] = []
): number {
  if (!my.length || !other.length) return 0;

  const mySet = new Set(my.map(v => v.toLowerCase()));
  const otherSet = new Set(other.map(v => v.toLowerCase()));

  const common = [...mySet].filter(v => otherSet.has(v)).length;

  if (common >= 5) return 5;
  if (common === 4) return 4.5;
  if (common === 3) return 4;
  if (common === 2) return 3;
  if (common === 1) return 2;

  return 0;
}