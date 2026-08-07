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

  minHeight?: number;
  maxHeight?: number;


  interests?: {
  key: string;
  values: string[];
}[];
  languages?: {
  key: string;
  values: string[];
}[];

zodiac?: {
  key: string;
  values: string[];
}[];

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
// EDUCATION FILTER (✔ SAME PATTERN)
// -------------------------
if (filters.education && filters.education.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.education.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "education"
            },
          },
        },
      },
    })),
  ];
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
// ZODIAC FILTER
// -------------------------
if (filters.zodiac && filters.zodiac.length > 0) {
  userWhere.AND = [
    ...(userWhere.AND || []),
    ...filters.zodiac.map((group) => ({
      answer: {
        some: {
          option: {
            value: {
              in: group.values.map((v: string) => v.toLowerCase()),
            },
            question: {
              key: group.key, // e.g. "zodiac"
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
