export const buildFilterQuery = (filters: any) => {
  const userWhere: any = {};
  const profileWhere: any = {};

  const today = new Date();

  // ✅ AGE → convert to DOB
  if (filters.ageMin || filters.ageMax) {
    profileWhere.date_of_birth = {};

    if (filters.ageMin) {
      const maxDOB = new Date(
        today.getFullYear() - filters.ageMin,
        today.getMonth(),
        today.getDate()
      );
      profileWhere.date_of_birth.lte = maxDOB;
    }

    if (filters.ageMax) {
      const minDOB = new Date(
        today.getFullYear() - filters.ageMax,
        today.getMonth(),
        today.getDate()
      );
      profileWhere.date_of_birth.gte = minDOB;
    }
  }

  // ✅ HEIGHT
  if (filters.heightMin || filters.heightMax) {
    profileWhere.height = {};
    if (filters.heightMin) profileWhere.height.gte = filters.heightMin;
    if (filters.heightMax) profileWhere.height.lte = filters.heightMax;
  }

  // ✅ RELIGION
  if (filters.religion?.length) {
    profileWhere.religion = { in: filters.religion };
  }

  // ✅ COMMUNITY
  if (filters.community?.length) {
    profileWhere.community = { in: filters.community };
  }

  // ✅ MARITAL STATUS
  if (filters.maritalStatus?.length) {
    profileWhere.marital_status = { in: filters.maritalStatus };
  }

  // ✅ CHILDREN
  if (filters.hasChildren?.length) {
    profileWhere.has_children = { in: filters.hasChildren };
  }

  // ✅ LOCATION
  if (filters.country) profileWhere.country = filters.country;
  if (filters.state) profileWhere.state = filters.state;
  if (filters.city) profileWhere.city = filters.city;

  // ✅ EDUCATION
  if (filters.education?.length) {
    profileWhere.education = { in: filters.education };
  }

  // ✅ VERIFICATION (User table)
  if (filters.verificationLevels?.length) {
    userWhere.verification_level = { in: filters.verificationLevels };
  }

  return { userWhere, profileWhere };
};
