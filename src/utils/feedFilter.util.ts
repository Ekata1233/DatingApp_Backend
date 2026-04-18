type Preferences = {
  verificationLevel?: string;
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  maxHeight?: number;
  religion?: string;
  community?: string;
  city?: string;
  state?: string;
  country?: string;
  maritalStatus?: string;
  childrenPreference?: string;
  livingWith?: string;
  highestEducation?: string;
  educationArea?:string;
  workingWith?: string;
  annualIncome?:string;
  drinking?: string;
  smoking?: string;
  diet?: string;
  profileManaged?:string;
  mangkik?:string;
  astroMatch?:string;
  location?:string;
  hasBio?:boolean;
  interests?:string;
  maxDistance?: number;
  interestedIn?: string;
  lookingFor?:string;
  lannguages?:string;
  Zodiac:string;
  occupation?:string;
  CommunicationStyle?:string;
  loveStyle?:string;
  pets?:string;
  workout?:string;
  socialMedia?:string;
  sprirituality?:string;
  primaryIncomeSource?:string;
  financialPreference?:string;
  healthConditionPreference?:string;
  futureLivingPlans?:string;
};

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
        today.getDate(),
      );
      profileWhere.date_of_birth.lte = maxDOB;
    }

    if (filters.ageMax) {
      const minDOB = new Date(
        today.getFullYear() - filters.ageMax,
        today.getMonth(),
        today.getDate(),
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
