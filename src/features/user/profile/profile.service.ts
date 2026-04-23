import {
  ChildLivingArrangement,
  ChildStatus,
  LivingSituation,
  LookingFor,
  LookingForOption,
  MaritalStatus,
  NumberOfChildren,
} from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { getNextStep } from "../../../utils/onboardingFlows";
import { SaveAnswerDTO } from "./profile.types";
import imagekit from "../../../utils/imagekit";

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
  genderOption?: string,
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
      genderOption,
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
  const currentStep = "INTRESTED_IN";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      interested_in,
      sexual_orientation,
    },
    create: {
      user_id: userId,
      interested_in,
      sexual_orientation,
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
    updatedProfile,
    updatedUser,
  };
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
    updatedProfile,
    updatedUser,
  };
};

//Looking For
export const updateLookingForService = async (
  userId: string,
  looking_for: LookingFor,
  looking_for_option: LookingForOption,
) => {
  if (!userId) throw new Error("User ID is required");

  const currentStep = "LOOKING_FOR";
  const nextStep = getNextStep(looking_for, currentStep);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      looking_for,
      looking_for_option,
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  return updatedUser;
};

//Address
export const updateAddressService = async (
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

  const currentStep = "ADDRESS";
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
  },
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
export const updateLocationService = async (
  userId: string,
  latitude: number,
  longitude: number,
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

//Question Answer
export const updateUserAnswerService = async (
  userId: string,
  payload: SaveAnswerDTO,
) => {
  if (!userId) throw new Error("Unauthorized");

  const { questionId, optionIds } = payload;

  // 🔍 Check question exists
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, isMulti: true },
  });

  if (!question) {
    throw new Error("Question not found");
  }

  // ❌ If single select but multiple options sent
  if (!question.isMulti && optionIds.length > 1) {
    throw new Error("Only one option allowed for this question");
  }

  // 🧹 Remove previous answers for this question (important)
  await prisma.userAnswer.deleteMany({
    where: {
      user_id: userId,
      question_id: questionId,
    },
  });

  // 💾 Insert new answers (bulk)
  const answersData = optionIds.map((optionId) => ({
    user_id: userId,
    question_id: questionId,
    option_id: optionId,
  }));

  await prisma.userAnswer.createMany({
    data: answersData,
    skipDuplicates: true,
  });

  return {
    questionId,
    savedOptions: optionIds,
  };
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

//Education
export const updateEducationService = async (
  userId: string,
  data: {
    highestEdu?: string;
    collegeName?: string;
  },
) => {
  if (!userId) throw new Error("User ID is missing");

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  const currentStep = "EDUCATION";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const eduWork = await prisma.userEduWork.upsert({
    where: { userId },
    update: {
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
    },
    create: {
      userId,
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
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

//work
export const updateWorkService = async (
  userId: string,
  data: {
    incomeRange: string;
    workingWith?: any;
    workingAs?: string;
    companyName?: string;
  },
) => {
  if (!userId) throw new Error("User ID is missing");

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  const currentStep = "WORK";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

  const { minIncome, maxIncome } = parseIncomeRange(data.incomeRange);

  // ✅ NEW
  const incomeEnum = mapIncomeToEnum(data.incomeRange);

  if (!incomeEnum) {
    throw new Error("Invalid income range");
  }

  const eduWork = await prisma.userEduWork.upsert({
    where: { userId },
    update: {
      incomeRange: incomeEnum, // ✅ FIXED
      minIncome,
      maxIncome,
      workingWith: data.workingWith,
      workingAs: data.workingAs,
      companyName: data.companyName,
    },
    create: {
      userId,
      incomeRange: incomeEnum, // ✅ FIXED
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

// Upload Photos
export const uploadUserPhotosService = async (userId: string, files: any[]) => {
  if (!userId) throw new Error("User ID is required");

  if (!files || files.length === 0) {
    throw new Error("No images provided");
  }

  // Check looking_for (onboarding dependency)
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  // Upload all images
 const uploadedPhotos = await Promise.all(
  files.map(async (file: any, index: number) => {

    const base64File = file.data.toString("base64"); // ✅ added

    const uploadResponse = await imagekit.upload({
      file: base64File, // ✅ changed
      fileName: file.name,
      folder: "/user-photos",
    });

    const isVideo = file.mimetype?.startsWith("video");

    return {
      user_id: userId,
      media_url: uploadResponse.url,
      order: index + 1,
      is_primary: index === 0,
      media_type: isVideo ? "video" : "image",
    };
  }),
);


  // Save in DB
  await prisma.userPhoto.createMany({
    data: uploadedPhotos,
  });

  // ✅ Fetch saved photos with IDs
  const savedPhotos = await prisma.userPhoto.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "asc" },
  });

  // Onboarding step update
  const currentStep = "LATEST_PHOTOS";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

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
    photos: savedPhotos,
    onboarding: updatedUser,
  };
};

export const updateUserPhotoService = async (
  userId: string,
  photoId: string,
  file: any,
) => {
  if (!userId) throw new Error("User ID is required");
  const isVideo = file.mimetype?.startsWith("video");
  const existingPhoto = await prisma.userPhoto.findUnique({
    where: { id: photoId },
  });

  if (!existingPhoto) {
    throw new Error("Photo not found");
  }

  const uploadResponse = await imagekit.upload({
    file: file.data,
    fileName: file.name,
    folder: "/user-photos",
  });

  const updatedPhoto = await prisma.userPhoto.update({
    where: { id: photoId },
    data: {
      media_url: uploadResponse.url,
      media_type: isVideo ? "video" : "image", // ✅ ADDED
    },
  });

  return updatedPhoto;
};

export const setPrimaryPhotoService = async (
  userId: string,
  photoId: string,
) => {
  await prisma.userPhoto.updateMany({
    where: { user_id: userId },
    data: { is_primary: false },
  });

  const photo = await prisma.userPhoto.update({
    where: { id: photoId },
    data: { is_primary: true },
  });

  return photo;
};

export const deleteUserPhotoService = async (
  userId: string,
  photoId: string,
) => {
  const photo = await prisma.userPhoto.findUnique({
    where: { id: photoId },
  });

  if (!photo) throw new Error("Photo not found");

  await prisma.userPhoto.delete({
    where: { id: photoId },
  });

  return { message: "Photo deleted" };
};

//Bio
export const updateUserBioService = async (userId: string, bio?: string) => {
  if (!userId) throw new Error("User ID is required");

  // 🔍 Check onboarding dependency
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { looking_for: true },
  });

  if (!existingUser?.looking_for) {
    throw new Error("Looking_for is missing");
  }

  // ✅ Upsert Bio
  const userBio = await prisma.userBio.upsert({
    where: { user_id: userId },
    update: {
      bio,
    },
    create: {
      user_id: userId,
      bio,
    },
  });

  // ✅ Onboarding Step
  const currentStep = "USER_BIO";
  const nextStep = getNextStep(existingUser.looking_for, currentStep);

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
    bio: userBio,
    onboarding: updatedUser,
  };
};
