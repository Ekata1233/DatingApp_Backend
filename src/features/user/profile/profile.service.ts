import { prisma } from "../../../prisma/prismaClient";

export const updateNameService = async (userId: string, name: string) => {
  if (!userId) throw new Error("User ID is missing");

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      onboarding_step: 2,
    },
  });

  return user;
};



// Update Birth Date
export const updateBirthDateService = async (userId: string, birth_date: string) => {
  // Ensure profile exists
  let profile = await prisma.userProfile.findUnique({
    where: { user_id: userId }
  });

  if (!profile) {
    profile = await prisma.userProfile.create({
      data: { user_id: userId }
    });
  }

  const updatedProfile = await prisma.userProfile.update({
    where: { user_id: userId },
    data: {
      birth_date: new Date(birth_date)
    }
  });

  // Update onboarding_step in user table
  await prisma.user.update({
    where: { id: userId },
    data: { onboarding_step: 3 } // next step
  });

  return updatedProfile;
};


//Gender
export const updateGenderService = async (userId: string, gender: string) => {

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      gender
    },
    create: {
      user_id: userId,
      gender
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: 4
    }
  });

  return updatedProfile;
};

//Sexual_Orientation 
export const updateSexualOrientationService = async (
  userId: string,
  sexual_orientation: string
) => {

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      sexual_orientation
    },
    create: {
      user_id: userId,
      sexual_orientation
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: 5
    }
  });

  return updatedProfile;
};


//Interested In
export const updateInterestedInService = async (
  userId: string,
  interested_in: string
) => {

  const updatedProfile = await prisma.userProfile.upsert({
    where: { user_id: userId },
    update: {
      interested_in
    },
    create: {
      user_id: userId,
      interested_in
    }
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: 6
    }
  });

  return updatedProfile;
};
