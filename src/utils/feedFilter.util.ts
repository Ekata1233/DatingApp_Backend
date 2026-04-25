export type Preferences = {
  verificationLevel?: string[];   // multi-select
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  maxDistance?: number;

  interestedIn?: string;

  minAge?: number;
  maxAge?: number;

  minHeight?: number;
  maxHeight?: number;

  hasBio?: boolean;

  interests?: string[];
  lookingFor?: string[];
  languages?: string[];

  zodiac?: string[];
  maritalStatus?: string[];

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


export const buildFilterQuery = (filters: Preferences, currentUser?: any) => {
  const userWhere: any = {};
  const profileWhere: any = {};
  const AND: any[] = [];

  const today = new Date();

  // -------------------------
  // ✅ AGE → DOB
  // -------------------------
  if (filters.minAge || filters.maxAge) {
    const dobFilter: any = {};

    if (filters.minAge) {
      dobFilter.lte = new Date(
        today.getFullYear() - filters.minAge,
        today.getMonth(),
        today.getDate()
      );
    }

    if (filters.maxAge) {
      dobFilter.gte = new Date(
        today.getFullYear() - filters.maxAge,
        today.getMonth(),
        today.getDate()
      );
    }

    AND.push({ date_of_birth: dobFilter });
  }

  // -------------------------
  // ✅ HEIGHT
  // -------------------------
  if (filters.minHeight || filters.maxHeight) {
    const heightFilter: any = {};

    if (filters.minHeight) heightFilter.gte = filters.minHeight;
    if (filters.maxHeight) heightFilter.lte = filters.maxHeight;

    AND.push({ height: heightFilter });
  }

  // -------------------------
  // ✅ LOCATION
  // -------------------------
  if (filters.location?.country) {
    AND.push({ country: filters.location.country });
  }

  if (filters.location?.state) {
    AND.push({ state: filters.location.state });
  }

  if (filters.location?.city) {
    AND.push({ city: filters.location.city });
  }

  // -------------------------
  // ✅ GENDER + RECIPROCITY
  // -------------------------
  if (filters.interestedIn && currentUser?.profile?.gender) {
    AND.push({
      gender: filters.interestedIn,
    });

    AND.push({
      interested_in: currentUser.profile.gender,
    });
  }

  // -------------------------
  // ✅ VERIFICATION
  // -------------------------
  if (filters.verificationLevel?.length) {
    userWhere.verification_level = {
      in: filters.verificationLevel,
    };
  }

  // -------------------------
  // ✅ HAS BIO (STRICT)
  // -------------------------
  if (filters.hasBio) {
    AND.push({
      bio: {
        notIn: [null, ""],
      },
    });
  }

  // -------------------------
  // ✅ INTERESTS
  // -------------------------
  if (filters.interests?.length) {
    AND.push({
      interests: {
        hasSome: filters.interests,
      },
    });
  }

  // -------------------------
  // ✅ LANGUAGES
  // -------------------------
  if (filters.languages?.length) {
    AND.push({
      languages: {
        hasSome: filters.languages,
      },
    });
  }

  // -------------------------
  // ✅ ENUM FILTERS
  // -------------------------
  const addArrayFilter = (field: string, values?: string[]) => {
    if (values?.length) {
      AND.push({
        [field]: { in: values },
      });
    }
  };

  addArrayFilter("looking_for", filters.lookingFor);
  addArrayFilter("zodiac", filters.zodiac);
  addArrayFilter("marital_status", filters.maritalStatus);
  addArrayFilter("education", filters.education);
  addArrayFilter("occupation", filters.occupation);
  addArrayFilter("communication_style", filters.communicationStyle);
  addArrayFilter("love_style", filters.loveStyle);
  addArrayFilter("pets", filters.pets);
  addArrayFilter("diet", filters.diet);
  addArrayFilter("drinking", filters.drinking);
  addArrayFilter("smoking", filters.smoking);
  addArrayFilter("workout", filters.workout);

  // -------------------------
  // ✅ SOCIAL MEDIA
  // -------------------------
  if (filters.socialMedia?.length) {
    AND.push({
      social_media: {
        hasSome: filters.socialMedia,
      },
    });
  }

  // -------------------------
  // ✅ ACTIVE USERS ONLY (🔥 important)
  // -------------------------
  AND.push({
    last_active_at: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // -------------------------
  // ✅ PROFILE COMPLETION
  // -------------------------
  AND.push({
    profile_completion_score: {
      gte: 50,
    },
  });

  // -------------------------
  // ✅ EXCLUDE SELF
  // -------------------------
  if (currentUser?.id) {
    userWhere.id = { not: currentUser.id };
  }

  // -------------------------
  // ✅ FINAL CLEAN BUILD
  // -------------------------
  if (AND.length) {
    profileWhere.AND = AND;
  }

  return {
    where: {
      ...userWhere,
      profile: Object.keys(profileWhere).length
        ? { is: profileWhere }
        : undefined,
    },
  };
};

