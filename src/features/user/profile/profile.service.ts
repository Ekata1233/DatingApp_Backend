import { ChildLivingArrangement, ChildStatus, IncomeRangeType, LivingSituation, MaritalStatus, NumberOfChildren } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { getNextStep } from "../../../utils/onboardingFlows";

// 🔥 Income Range Parser
const parseIncomeRange = (incomeRange: string) => {
  if (!incomeRange) return { minIncome: null, maxIncome: null };

  const match = incomeRange
    .toLowerCase()
    .match(/(\d+)\s*lakh\s*to\s*(\d+)\s*lakh/);

  if (!match) return { minIncome: null, maxIncome: null };

  const min = parseInt(match[1]) * 100000;
  const max = parseInt(match[2]) * 100000;

  return {
    minIncome: min,
    maxIncome: max,
  };
};


//profile update service
export const updateProfileService = async (
  userId: string,
  fullName: string,
  email: string,
  birth_date: string,
  height: number,
  gender: string,
) => {
  if (!userId) throw new Error("User ID is missing");

   const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

if (!existingUser?.looking_for) {
  throw new Error("Looking_for is missing");
}

  // 👉 Calculate next step
  const currentStep = "BASIC_INFO";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      full_name: fullName,
      email,
      birth_date: new Date(birth_date),
      height,
      gender,
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  return user;
};

//Interested In
export const updateInterestedInService = async (
  userId: string,
  interested_in: string,
) => {
  if (!userId) throw new Error("User ID is missing");

   const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

if (!existingUser?.looking_for) {
  throw new Error("Looking_for is missing");
}

  // 👉 Calculate next step
  const currentStep = "INTRESTED_IN";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      interested_in,
    },
    create: {
      user_id: userId,
      interested_in,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  return updatedProfile;
};

//Religion
export const updateReligionService = async (
  userId: string,
  religion: string,
  community: string,
) => {
  if (!userId) throw new Error("User ID is missing");

   const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

if (!existingUser?.looking_for) {
  throw new Error("Looking_for is missing");
}

  // 👉 Calculate next step
  const currentStep = "RELIGION";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      religion,
      community,
    },
    create: {
      user_id: userId,
      religion,
      community,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  return updatedProfile;
};

//Sexual_Orientation
export const updateSexualOrientationService = async (
  userId: string,
  sexual_orientation: string,
) => {
  if (!userId) throw new Error("User ID is missing");

   const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

if (!existingUser?.looking_for) {
  throw new Error("Looking_for is missing");
}

  // 👉 Calculate next step
  const currentStep = "BASIC_INFO";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      sexual_orientation,
    },
    create: {
      user_id: userId,
      sexual_orientation,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: "LOOKING_FOR",
      next_step: nextStep,
    },
  });

  return updatedProfile;
};

//Looking For
export const updateLookingForService = async (
  userId: string,
  looking_for: string
) => {
  if (!userId) throw new Error("User ID is required");

  const currentStep = "LOOKING_FOR";
  const nextStep = getNextStep("MARRIAGE", currentStep);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      looking_for,
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  return updatedUser;
};

//Location
export const updateLocationService = async (
  userId: string,
  country: string,
  state: string,
  city: string,
) => {
  if (!userId) throw new Error("User ID is missing");

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  const currentStep = "LOCATION";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const profile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: { country, state, city },
    create: { user_id: userId, country, state, city },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
    select: {
      onboarding_step: true,
      next_step: true,
    },
  });

  return {
    profile,
    onboarding: updatedUser,
  };
};

//About Yourself
export const updateAboutYourselfService = async (
  userId: string,
  data: {
    maritalStatus?: MaritalStatus;
    childStatus?: ChildStatus;
    numberOfChildren?: NumberOfChildren | null;
    childLivingArrangement?: ChildLivingArrangement | null;
    livingSituation?: LivingSituation;
  }
) => {
  if (!userId) throw new Error("User ID is missing");

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  // ✅ Business Validation (IMPORTANT)
  if (data.childStatus === "NO") {
    data.numberOfChildren = null;
    data.childLivingArrangement = null;
  }

  if (data.childStatus === "YES" && !data.numberOfChildren) {
    throw new Error("Number of children is required");
  }

  // ✅ Onboarding Step Logic
  const currentStep = "ABOUT_YOURSELF";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  // ✅ Upsert UserAbout
  const profile = await prisma.userAbout.upsert({
    where: { user_id: userId },
    update: {
      maritalStatus: data.maritalStatus,
      childStatus: data.childStatus,
      numberOfChildren: data.numberOfChildren,
      childLivingArrangement: data.childLivingArrangement,
      livingSituation: data.livingSituation,
    },
    create: {
      user_id: userId,
      maritalStatus: data.maritalStatus,
      childStatus: data.childStatus,
      numberOfChildren: data.numberOfChildren,
      childLivingArrangement: data.childLivingArrangement,
      livingSituation: data.livingSituation,
    },
  });

  // ✅ Update onboarding progress
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
    select: {
      onboarding_step: true,
      next_step: true,
    },
  });

  return {
    profile,
    onboarding: updatedUser,
  };
};


//Location
export const updateLatLngService = async (
  userId: string,
  latitude: number,
  longitude: number
) => {
  if (!userId) throw new Error("User ID is required");

  const profile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      latitude,
      longitude,
    },
    create: {
      user_id: userId,
      latitude,
      longitude,
    },
  });

  return profile;
};


// ✅ ADD THIS (NEW)
const mapIncomeToEnum = (incomeRange: string) => {
  switch (incomeRange) {
    case "INR 1 lakh to 2 lakh":
      return "INR_1_TO_2_LAKH";
    case "INR 2 lakh to 4 lakh":
      return "INR_2_TO_4_LAKH";
    case "INR 4 lakh to 7 lakh":
      return "INR_4_TO_7_LAKH";
    case "INR 10 lakh to 15 lakh":
      return "INR_10_TO_15_LAKH";
    case "INR 15 lakh to 20 lakh":
      return "INR_15_TO_20_LAKH";
    default:
      return null;
  }
};
//Education & Work
export const updateEduWorkService = async (
  userId: string,
  data: {
    highestEdu?: string;
    collegeName?: string;
    incomeRange: string;
    workingWith?: any;
    workingAs?: string;
    companyName?: string;
  }
) => {
  if (!userId) throw new Error("User ID is missing");

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  const currentStep = "EDUCATION_WORK";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  // 🔥 Convert incomeRange → min/max
const { minIncome, maxIncome } = parseIncomeRange(data.incomeRange);


const incomeEnum = mapIncomeToEnum(data.incomeRange);

if (!incomeEnum) {
  throw new Error("Invalid income range");
}

  const eduWork = await prisma.userEduWork.upsert({
    where: { userId },
    update: {
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
      incomeRange: incomeEnum,
      minIncome,
      maxIncome,
      workingWith: data.workingWith,
      workingAs: data.workingAs,
      companyName: data.companyName,
    },
    create: {
      userId,
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
       incomeRange: incomeEnum,
      minIncome,
      maxIncome,
      workingWith: data.workingWith,
      workingAs: data.workingAs,
      companyName: data.companyName,
    },
  });

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
    select: {
      onboarding_step: true,
      next_step: true,
    },
  });

  return {
    eduWork,
    onboarding: updatedUser,
  };
};