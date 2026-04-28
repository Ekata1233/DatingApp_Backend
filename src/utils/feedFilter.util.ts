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

  hasBio?: boolean;

  interests?: string[];
  lookingFor?: string[];
  languages?: string[];

  zodiac?: string[];

  education?: string[];
  occupation?: string[];

  communicationStyle?: string[];
  loveStyle?: string[];

  pets?: string[];
  diet?: string[];
  drinking?: string[];
  smoking?: string[];
  workout?: string[];

  socialMedia?: string[];
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
