import { prisma } from "../../../prisma/prismaClient";

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

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      full_name: fullName,
      email,
      birth_date: new Date(birth_date),
      height,
      gender,
      onboarding_step: 2,
    },
  });

  return user;
};

//Interested In
export const updateInterestedInService = async (
  userId: string,
  interested_in: string,
) => {
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
      onboarding_step: 6,
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
      onboarding_step: 5,
    },
  });

  return updatedProfile;
};

//Sexual_Orientation
export const updateSexualOrientationService = async (
  userId: string,
  sexual_orientation: string,
) => {
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
      onboarding_step: 5,
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

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      looking_for,
      onboarding_step: 2, // move to next step
    },
  });

  return updatedUser;
};
