export type Preferences = {
  verificationLevel?: string[];

  location?: {
    city?: string;
    state?: string;
    country?: string;
  };

  interestedIn?: string;
  sexualOrientation?: string;

  minAge?: number;
  maxAge?: number;
distanceKm?: number;
  minHeight?: number;
  maxHeight?: number;
  religionIds?: number[];
  communityIds?: number[];
intentionOption?: string[];
  professionIds?: number[];
  
  interests?: {
  key: string;
  values: string[];
}[];
  languages?: {
  key: string;
  values: string[];
}[];

zodiac?: string[];

education?: {
  key: string;
  values: string[];
}[];

occupation?: {
  key: string;
  values: string[];
}[];

communicationStyle?: {
  key: string;
  values: string[];
}[];
travel?: {
  key: string;
  values: string[];
}[];

sleep?: {
  key: string;
  values: string[];
}[];
loveStyle?: {
  key: string;
  values: string[];
}[];

pets?: {
  key: string;
  values: string[];
}[];

diet?: {
  key: string;
  values: string[];
}[];

drinking?: {
  key: string;
  values: string[];
}[];

smoking?: {
  key: string;
  values: string[];
}[];

workout?: {
  key: string;
  values: string[];
}[];

socialMedia?: {
  key: string;
  values: string[];
}[];
// VIP / VIP_ELITE filter
  ambitionIds?: number[];
  familyIncomeMin?: number;
familyIncomeMax?: number;
 familyIncomeIds?: number[];
  networkingIntentIds?: string[];
};

export const buildFilterQuery = (filters: Preferences) => {
  const userWhere: any = {};
  const profileWhere: any = {};

  // -------------------------
  // AGE FILTER
  // -------------------------
  if (filters.minAge || filters.maxAge) {
    const today = new Date();

    const minDOB = filters.maxAge
      ? new Date(today.getFullYear() - filters.maxAge, 0, 1)
      : undefined;

    const maxDOB = filters.minAge
      ? new Date(today.getFullYear() - filters.minAge, 11, 31)
      : undefined;

    userWhere.birth_date = {
      ...(minDOB && { gte: minDOB }),
      ...(maxDOB && { lte: maxDOB }),
    };
  }

  // -------------------------
  // HEIGHT FILTER
  // -------------------------
  if (filters.minHeight || filters.maxHeight) {
    userWhere.height = {
      ...(filters.minHeight && { gte: filters.minHeight }),
      ...(filters.maxHeight && { lte: filters.maxHeight }),
    };
  }

// -------------------------
// RELIGION FILTER
// -------------------------
if (
  filters.religionIds &&
  filters.religionIds.length > 0
) {
  profileWhere.religionId = {
    in: filters.religionIds,
  };
}

// -------------------------
// COMMUNITY FILTER
// -------------------------
if (
  filters.communityIds &&
  filters.communityIds.length > 0
) {
  profileWhere.communityId = {
    in: filters.communityIds,
  };
}

  // -------------------------
  // LOCATION FILTER (UserProfile) ✔ FIXED
  // -------------------------
  if (filters.location?.country) {
    profileWhere.country = filters.location.country;
  }

  if (filters.location?.state) {
    profileWhere.state = filters.location.state;
  }

  if (filters.location?.city) {
    profileWhere.city = filters.location.city;
  }

  // -------------------------
  // INTERESTED IN (FIXED ✔)
  // -------------------------
  if (filters.interestedIn) {
    userWhere.gender = {
      in: [filters.interestedIn.toUpperCase()],
    };
  }
  // -------------------------
  // SEXUAL ORIENTATION (✔ FIX)
  // -------------------------
  if (filters.sexualOrientation) {
    const values = Array.isArray(filters.sexualOrientation)
      ? filters.sexualOrientation
      : [filters.sexualOrientation];

    userWhere.gender_option = {
      in: values.map((v) => v.toUpperCase()),
    };
  }

  // -------------------------
// INTENTION OPTION FILTER
// -------------------------
if (
  filters.intentionOption &&
  filters.intentionOption.length > 0
) {
  userWhere.intentionId = {
    in: filters.intentionOption,
  };
}
// -------------------------
// ZODIAC FILTER
// -------------------------
if (
  filters.zodiac &&
  filters.zodiac.length > 0
) {
  userWhere.about = {
    is: {
      zodiac: {
        in: filters.zodiac,
      },
    },
  };
}

// -------------------------
// PROFESSION FILTER
// -------------------------
if (
  filters.professionIds &&
  filters.professionIds.length > 0
) {
  userWhere.eduWork = {
    is: {
      professionId: {
        in: filters.professionIds,
      },
    },
  };
}

// -------------------------
// AMBITION FILTER
// -------------------------
if (
  filters.ambitionIds &&
  filters.ambitionIds.length > 0
) {
  userWhere.eduWork = {
    is: {
      ambitionId: {
        in: filters.ambitionIds,
      },
    },
  };
}

// -------------------------
// FAMILY INCOME FILTER - VIP ONLY
// -------------------------
if (
  filters.familyIncomeIds &&
  filters.familyIncomeIds.length > 0
) {
  userWhere.familyProfile = {
    is: {
      familyIncomeId: {
        in: filters.familyIncomeIds,
      },
    },
  };
}
// -------------------------
// NETWORKING INTENT FILTER
// VIP / VIP_ELITE
// -------------------------

if (
  filters.networkingIntentIds &&
  filters.networkingIntentIds.length > 0
) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    {
      answer: {
        some: {
          option_id: {
            in: filters.networkingIntentIds,
          },
          question: {
            screen: "NETWORKING_INTENT",
          },
        },
      },
    },
  ];
}
  // -------------------------
// INTERESTS FILTER BY KEY (FINAL ✔)
// -------------------------
if (filters.interests && filters.interests.length > 0) {
  userWhere.AND = filters.interests.map((group) => ({
    answer: {
      some: {
        option: {
          value: {
            in: group.values.map((v: string) => v.toLowerCase()),
          },
          question: {
            key: group.key,
          },
        },
      },
    },
  }));
}


// -------------------------
// EDUCATION FILTER
// UserEduWork.highestEdu
// -------------------------
if (filters.education && filters.education.length > 0) {
  const educationValues = filters.education.flatMap(
    (group) => group.values
  );

  userWhere.eduWork = {
    is: {
      highestEdu: {
        in: educationValues.map((value: string) =>
          value.toUpperCase()
        ),
      },
    },
  };
}

// -------------------------
// OCCUPATION FILTER (✔ SAME AS INTERESTS)
// -------------------------
if (filters.occupation && filters.occupation.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.occupation.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "occupation"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// COMMUNICATION STYLE FILTER
// -------------------------
if (filters.communicationStyle && filters.communicationStyle.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.communicationStyle.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "communication_style"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// PETS FILTER
// -------------------------
if (filters.pets && filters.pets.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.pets.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "pets"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// DIET FILTER
// -------------------------
if (filters.diet && filters.diet.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.diet.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "diet"
            },
          },
        },
      },
    })),
  ];
}


// -------------------------
// DRINKING FILTER
// -------------------------
if (filters.drinking && filters.drinking.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.drinking.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "drinking"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// SMOKING FILTER
// -------------------------
if (filters.smoking && filters.smoking.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.smoking.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "smoking"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// WORKOUT FILTER
// -------------------------
if (filters.workout && filters.workout.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.workout.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "workout"
            },
          },
        },
      },
    })),
  ];
}
// -------------------------
// travel
// -------------------------
if (filters.travel && filters.travel.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.travel.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) =>
                v.toLowerCase()
              ),
            },
            question: {
              key: group.key,
            },
          },
        },
      },
    })),
  ];
}
// -------------------------
// SLEEP
// -------------------------
if (filters.sleep && filters.sleep.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.sleep.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) =>
                v.toLowerCase()
              ),
            },
            question: {
              key: group.key,
            },
          },
        },
      },
    })),
  ];
}


// -------------------------
// LANGUAGES FILTER
// -------------------------
if (filters.languages && filters.languages.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.languages.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "languages"
            },
          },
        },
      },
    })),
  ];
}

// -------------------------
// SOCIAL MEDIA FILTER
// -------------------------
if (filters.socialMedia && filters.socialMedia.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.socialMedia.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "social_media"
            },
          },
        },
      },
    })),
  ];
}


  return {
    where: {
      ...userWhere,

      profile: Object.keys(profileWhere).length
        ? {
            is: profileWhere, // 🔥 THIS is mandatory
          }
        : undefined,
    },
  };
};
