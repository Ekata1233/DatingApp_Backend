import {
  ChildLivingArrangement,
  ChildStatus,
  EducationLevel,
  Gender,
  GenderOption,
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
import { calculateProfileScore } from "../../../utils/profileCompletion.utils";
import { ReferralService } from "../referral/referral.service";
import { redis } from "../../../lib/redis";
import { queueMatchScoreCalculation } from "../../../queues/match-score.queue";
import { QUESTION_SCREEN_TO_ONBOARDING_STEP } from "../../../config/onboardingFlows";

//profile update service
export const updateProfileService = async (
  userId: string,
  fullName: string,
  email: string,
  birth_date: string,
  height: number,
  gender: Gender,
  gender_option?: GenderOption | null,
) => {
  if (!userId) throw new Error("User ID is missing");

  // Normalize email
  email = email.trim().toLowerCase();

  // Check if email already exists for another user
  const existingUser = await prisma.user.findFirst({
    where: {
      email,
      NOT: {
        id: userId,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    throw new Error("Email is already registered. Please use another email.");
  }
  // 👉 Calculate next step
  const currentStep = "BASIC_INFO";
  const nextStep = getNextStep(currentStep);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      full_name: fullName,
      email,
      birth_date: new Date(birth_date),
      height,
      gender,
      gender_option,
      onboarding_step: currentStep,
      next_step: nextStep,
    },
  });

  // 👉 UPDATE SCORE
  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: { id: userId },
    data: { profile_completion: score },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return user;
};

//Interested In
export const updateInterestedInService = async (
  userId: string,
  interested_in: Gender,
  sexual_orientation: GenderOption,
) => {
  if (!userId) throw new Error("User ID is missing");

  // 👉 Calculate next step
  const currentStep = "INTERESTED_IN";
  const nextStep = getNextStep(currentStep);
  console.log("nextStep", nextStep);

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

  // 👉 UPDATE SCORE
  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: { id: userId },
    data: { profile_completion: score },
  });

  await queueMatchScoreCalculation(
    userId,
  );
  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return {
    updatedProfile,
    updatedUser,
  };
};

//Religion
export const updateReligionService = async (
  userId: string,
  religionId: number,
  communityId: number,
) => {
  if (!userId) {
    throw new Error("User ID is missing");
  }

  // Validate community belongs to religion
  const community = await prisma.community.findUnique({
    where: {
      id: communityId,
    },
  });

  if (!community) {
    throw new Error("Community not found");
  }

  if (community.religionId !== religionId) {
    throw new Error("Selected community does not belong to selected religion");
  }

  const currentStep = "RELIGION";
  const nextStep = getNextStep(currentStep);

  const updatedProfile = await prisma.userProfile.upsert({
    where: {
      user_id: userId,
    },
    update: {
      religionId,
      communityId,
    },
    create: {
      user_id: userId,
      religionId,
      communityId,
    },
    include: {
      religion: true,
      community: true,
    },
  });

  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
      profile_completion: score,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return updatedProfile;
};

//Looking For [FOR THE MARRIAGE , DATING , MATURE CONNECTIONS]
// export const updateLookingForService = async (
//   userId: string,
//   looking_for: LookingFor,
//   looking_for_option: LookingForOption,

// ) => {
//   if (!userId) throw new Error("User ID is required");

//   const currentStep = "LOOKING_FOR";
//   const nextStep = getNextStep(looking_for, currentStep);

//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       looking_for,
//       looking_for_option,
//       onboarding_step: currentStep,
//       next_step: nextStep,
//     },
//   });

//   return updatedUser;
// };


//LOOKING FOR API BUT IN DATABASE MODEL NAME IS INTENTION
export const updateLookingForService = async (
  userId: string,
  optionId: string,
) => {
  if (!userId) throw new Error("User ID is required");

  const selectedOption = await prisma.intentionOption.findUnique({
    where: {
      id: optionId,
    },
  });

  if (!selectedOption) {
    throw new Error("Invalid option selected");
  }

  const score = await calculateProfileScore(userId);

  const currentStep = "LOOKING_FOR";
  const nextStep = getNextStep(currentStep);


  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      intentionId: selectedOption.id, // ✅ Save the option ID
      onboarding_step: currentStep,
      next_step: nextStep,
      profile_completion: score,
    },
    include: {
      intention: {
        include: {
          intention: true,
        },
      },
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return result;
};

//Address
export const updateAddressService = async (
  userId: string,
  country: string,
  state: string,
  city: string,
) => {
  if (!userId) throw new Error("User ID is missing");

  const currentStep = "ADDRESS";
  const nextStep = getNextStep(currentStep);

  const score = await calculateProfileScore(userId);

  const result = await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.upsert({
      where: {
        user_id: userId,
      },
      update: {
        country,
        state,
        city,
      },
      create: {
        user_id: userId,
        country,
        state,
        city,
      },
    });

    const onboarding = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        onboarding_step: currentStep,
        next_step: nextStep,
        profile_completion: score,
      },
      select: {
        onboarding_step: true,
        next_step: true,
      },
    });

    return {
      profile,
      onboarding,
    };
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return result;
};

//About Yourself
// export const updateAboutYourselfService = async (
//   userId: string,
//   data: {
//     maritalStatus?: MaritalStatus;
//     childStatus?: ChildStatus;
//     numberOfChildren?: NumberOfChildren | null;
//     childLivingArrangement?: ChildLivingArrangement | null;
//     livingSituation?: LivingSituation;
//   },
// ) => {
//   if (!userId) throw new Error("User ID is missing");

//   const existingUser = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { looking_for: true },
//   });

//   // ✅ Business Validation (IMPORTANT)
//   if (data.childStatus === "NO") {
//     data.numberOfChildren = null;
//     data.childLivingArrangement = null;
//   }

//   if (data.childStatus === "YES" && !data.numberOfChildren) {
//     throw new Error("Number of children is required");
//   }

//   // ✅ Onboarding Step Logic
//   const currentStep = "ABOUT_YOURSELF";
//   const nextStep = getNextStep( currentStep);

//   // ✅ Upsert UserAbout
//   const profile = await prisma.userAbout.upsert({
//     where: { user_id: userId },
//     update: {
//       maritalStatus: data.maritalStatus,
//       childStatus: data.childStatus,
//       numberOfChildren: data.numberOfChildren,
//       childLivingArrangement: data.childLivingArrangement,
//       livingSituation: data.livingSituation,
//     },
//     create: {
//       user_id: userId,
//       maritalStatus: data.maritalStatus,
//       childStatus: data.childStatus,
//       numberOfChildren: data.numberOfChildren,
//       childLivingArrangement: data.childLivingArrangement,
//       livingSituation: data.livingSituation,
//     },
//   });

//   // ✅ Update onboarding progress
//   const updatedUser = await prisma.user.update({
//     where: { id: userId },
//     data: {
//       onboarding_step: currentStep,
//       next_step: nextStep,
//     },
//     select: {
//       onboarding_step: true,
//       next_step: true,
//     },
//   });

//   return {
//     profile,
//     onboarding: updatedUser,
//   };
// };

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

  // ✅ Update PostGIS location
  await prisma.$executeRaw`
  UPDATE user_profiles
  SET location = ST_SetSRID(
    ST_MakePoint(${longitude}, ${latitude}),
    4326
  )::geography
  WHERE user_id = ${userId}::uuid;
`;

  // 👉 UPDATE SCORE
  const score = await calculateProfileScore(userId);

  const currentStep = "LOCATION";
  const nextStep = getNextStep(currentStep);

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep, profile_completion: score
    },
  });

  console.log("before bull mq")
  await queueMatchScoreCalculation(
    userId,
  );
  console.log("after bullmq")

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return {
    profile,
    onboarding_step: currentStep,
    next_step: nextStep,
    profile_completion: score,
  };
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
    select: { id: true, isMulti: true, screen: true },
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

  // =====================================================
  // GET ONBOARDING STEP FROM QUESTION SCREEN
  // =====================================================

  const currentStep =
    QUESTION_SCREEN_TO_ONBOARDING_STEP[question.screen];

  if (!currentStep) {
    throw new Error(
      `No onboarding step configured for question screen: ${question.screen}`,
    );
  }

  const nextStep = getNextStep(currentStep);

  // 👉 UPDATE SCORE
  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep, profile_completion: score
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return {
    questionId,
    screen: question.screen,
    currentStep,
    nextStep,
    savedOptions: optionIds,
  };
};

//Education
export const updateEducationService = async (
  userId: string,
  data: {
    highestEdu?: EducationLevel;
    degree?: string;
    collegeName?: string;
    graduationYear?: number;
  },
) => {
  if (!userId) throw new Error("User ID is missing");

  const currentStep = "CAREER_AMBITION";
  const nextStep = getNextStep(currentStep);

  const eduWork = await prisma.userEduWork.upsert({
    where: { userId },
    update: {
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
      degree: data.degree,
      graduationYear: data.graduationYear,
    },
    create: {
      userId,
      highestEdu: data.highestEdu,
      collegeName: data.collegeName,
      degree: data.degree,
      graduationYear: data.graduationYear,
    },
  });

  const score = await calculateProfileScore(userId);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
      profile_completion: score,
    },
    select: {
      onboarding_step: true,
      next_step: true,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return {
    eduWork,
    onboarding: updatedUser,
  };
};

//work
export const updateWorkService = async (
  userId: string,
  data: {
    professionId?: number;
    companyName?: string;
    employmentTypeId?: number;
    experienceId?: number;
    ambitionId?: number;
    salaryRangeId?: number;
    bigDreams?: string;
  },
) => {
  if (!userId) {
    throw new Error("User ID is missing");
  }

  const currentStep = "CAREER_AMBITION";
  const nextStep = getNextStep(currentStep);

  const eduWork = await prisma.userEduWork.upsert({
    where: {
      userId,
    },
    update: {
      professionId: data.professionId,
      companyName: data.companyName,
      employmentTypeId: data.employmentTypeId,
      experienceId: data.experienceId,
      ambitionId: data.ambitionId,
      salaryRangeId: data.salaryRangeId,
      bigDreams: data.bigDreams,
    },
    create: {
      userId,
      professionId: data.professionId,
      companyName: data.companyName,
      employmentTypeId: data.employmentTypeId,
      experienceId: data.experienceId,
      ambitionId: data.ambitionId,
      salaryRangeId: data.salaryRangeId,
      bigDreams: data.bigDreams,
    },
  });

  const score = await calculateProfileScore(userId);

  const onboarding = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
      profile_completion: score,
    },
    select: {
      onboarding_step: true,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return {
    eduWork,
    onboarding,
  };
};

//Family Profile
export const updateFamilyProfileService = async (
  userId: string,
  data: {
    familyStatusId?: number;
    familyTypeId?: number;

    fatherOccupationId?: number;
    fatherOrganisationId?: number;

    motherOccupationId?: number;
    motherOrganisationId?: number;

    siblings?: {
      siblingTypeId: number;
      occupationId?: number;
      maritalId?: number;
    }[];
    familyHomeId?: number;
    nativePlaceId?: number;

    familyIncomeId?: number;
  },
) => {
  if (!userId) throw new Error("User ID is missing");

  const currentStep = "FAMILY_DETAILS";
  const nextStep = getNextStep(currentStep);

  const { siblings, ...familyData } = data;

  const updatedProfile = await prisma.userFamilyProfile.upsert({
    where: {
      userId,
    },
    update: familyData,
    create: {
      userId,
      ...familyData,
    },
  });

  if (siblings) {
    await prisma.userSibling.deleteMany({
      where: {
        familyProfileId: updatedProfile.id,
      },
    });

    if (siblings.length) {
      await prisma.userSibling.createMany({
        data: siblings.map((item) => ({
          familyProfileId: updatedProfile.id,
          siblingTypeId: item.siblingTypeId,
          occupationId: item.occupationId ?? null,
          maritalId: item.maritalId ?? null,
        })),
      });
    }
  }
  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
    select: {
      onboarding_step: true,
    },
  });

  // Update Profile Completion Score
  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile_completion: score,
    },
  });

  const familyProfile = await prisma.userFamilyProfile.findUnique({
    where: {
      userId,
    },
    include: {
      siblings: {
        include: {
          siblingType: true,
          occupation: true,
          marital: true,
        },
      },
      familyStatus: true,
      familyType: true,
      fatherOccupation: true,
      fatherOrganisation: true,
      motherOccupation: true,
      motherOrganisation: true,
      familyHome: true,
      nativePlace: true,
      familyIncome: true,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return {
    updatedProfile: familyProfile,
    updatedUser,
  };
};

//language
export const updateLanguageService = async (
  userId: string,
  languageIds: number[],
) => {
  if (!userId) {
    throw new Error("User ID is missing");
  }

  if (!languageIds.length) {
    throw new Error("Please select at least one language");
  }

  const currentStep = "LANGUAGE";
  const nextStep = getNextStep(currentStep);

  await prisma.$transaction(async (tx) => {
    // Ensure UserProfile exists
    await tx.userProfile.upsert({
      where: {
        user_id: userId,
      },
      update: {},
      create: {
        user_id: userId,
      },
    });

    // Remove old languages
    await tx.userLanguage.deleteMany({
      where: {
        userId,
      },
    });

    // Add new languages
    await tx.userLanguage.createMany({
      data: languageIds.map((languageId) => ({
        userId,
        languageId,
      })),
    });

    const score = await calculateProfileScore(userId);

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        onboarding_step: currentStep,
        next_step: nextStep,
        profile_completion: score,
      },
    });
  });

  const result = await prisma.userLanguage.findMany({
    where: {
      userId,
    },
    include: {
      language: true,
    },
    orderBy: {
      language: {
        priority: "asc",
      },
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return result;
};

// Upload Photos
export const uploadUserMediaService = async (
  userId: string,
  files: any[],
  mediaType: "IMAGE" | "VIDEO",
) => {
  if (!userId) throw new Error("User ID is required");

  console.log("User ID:", userId);
  // console.log("Files received:", files);
  console.log("Media type:", mediaType);

  if (!files || files.length === 0) {
    throw new Error(
      mediaType === "IMAGE"
        ? "No images provided"
        : "No videos provided",
    );
  }

  const uploadedMedia = await Promise.all(
    files.map(async (file: any, index: number) => {
      const base64File = file.data.toString("base64");

      const uploadResponse = await imagekit.upload({
        file: base64File,
        fileName: file.name,
        folder:
          mediaType === "IMAGE"
            ? "/user-photos"
            : "/user-videos",
      });

      return {
        user_id: userId,
        media_url: uploadResponse.url,
        order: index + 1,
        is_primary: index === 0,
        media_type: mediaType,
      };
    }),
  );

  await prisma.userPhoto.createMany({
    data: uploadedMedia,
  });

  const savedMedia = await prisma.userPhoto.findMany({
    where: {
      user_id: userId,
      media_type: mediaType,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  const currentStep = "PHOTOS";
  const nextStep = getNextStep(currentStep);

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      onboarding_step: currentStep,
      next_step: nextStep,
    },
    select: {
      onboarding_step: true,
      next_step: true,
    },
  });

  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile_completion: score,
    },
  });

  return {
    media: savedMedia,
    onboarding: updatedUser,
  };
};

// Update Photo
export const updateUserMediaService = async (
  userId: string,
  mediaId: string,
  file: any,
  mediaType: "IMAGE" | "VIDEO",
) => {
  if (!userId) throw new Error("User ID is required");

  const existingMedia = await prisma.userPhoto.findFirst({
    where: {
      id: mediaId,
      user_id: userId,
    },
  });

  if (!existingMedia) {
    throw new Error("Media not found");
  }

  const base64File = file.data.toString("base64");

  const uploadResponse = await imagekit.upload({
    file: base64File,
    fileName: file.name,
    folder:
      mediaType === "IMAGE"
        ? "/user-photos"
        : "/user-videos",
  });

  const updatedMedia = await prisma.userPhoto.update({
    where: {
      id: mediaId,
    },
    data: {
      media_url: uploadResponse.url,
      media_type: mediaType,
    },
  });

  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile_completion: score,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return updatedMedia;
};

//primary photo
export const setPrimaryPhotoService = async (
  userId: string,
  photoId: string,
) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.userPhoto.updateMany({
      where: {
        user_id: userId,
      },
      data: {
        is_primary: false,
      },
    });

    const photo = await tx.userPhoto.updateMany({
      where: {
        id: photoId,
        user_id: userId,
        media_type: "IMAGE",
      },
      data: {
        is_primary: true,
      },
    });

    return photo;
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return result;
};

//Delete Photo
export const deleteUserMediaService = async (
  userId: string,
  mediaId: string,
  mediaType: "IMAGE" | "VIDEO",
) => {
  const media = await prisma.userPhoto.findFirst({
    where: {
      id: mediaId,
      user_id: userId,
      media_type: mediaType,
    },
  });

  if (!media) {
    throw new Error("Media not found");
  }

  await prisma.userPhoto.delete({
    where: {
      id: mediaId,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return {
    message:
      mediaType === "IMAGE"
        ? "Photo deleted"
        : "Video deleted",
  };
};

export const updateUserVideoService = async (
  userId: string,
  file: any,
) => {
  if (!userId) throw new Error("User ID is required");

  // Check existing video
  const existingVideo = await prisma.userPhoto.findFirst({
    where: {
      user_id: userId,
      media_type: "VIDEO",
    },
  });

  const base64File = file.data.toString("base64");

  const uploadResponse = await imagekit.upload({
    file: base64File,
    fileName: file.name,
    folder: "/user-videos",
  });

  let video;

  if (existingVideo) {
    // Update existing record
    video = await prisma.userPhoto.update({
      where: {
        id: existingVideo.id,
      },
      data: {
        media_url: uploadResponse.url,
      },
    });
  } else {
    // First upload
    video = await prisma.userPhoto.create({
      data: {
        user_id: userId,
        media_url: uploadResponse.url,
        media_type: "VIDEO",
        order: 1,
        is_primary: false,
      },
    });
  }

  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile_completion: score,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return video;
};

//Bio
export const updateUserBioService = async (userId: string, bio?: string) => {
  if (!userId) throw new Error("User ID is required");

  const currentStep = "STORY";
  const nextStep = getNextStep(currentStep);

  const result = await prisma.$transaction(async (tx) => {
    const userBio = await tx.userBio.upsert({
      where: {
        user_id: userId,
      },
      update: {
        bio,
      },
      create: {
        user_id: userId,
        bio,
      },
    });

    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
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
  });

  const score = await calculateProfileScore(userId);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      profile_completion: score,
    },
  });

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return result;
};

//prompt
export const updateUserPromptService = async (
  userId: string,
  prompts: {
    promptId: string;
    answer: string;
  }[],
) => {
  if (!userId) {
    throw new Error("User ID is missing");
  }

  if (!prompts.length) {
    throw new Error("Please select at least one prompt");
  }

  if (prompts.length > 3) {
    throw new Error("You can select maximum 3 prompts");
  }

  const currentStep = "PROMPT";
  const nextStep = getNextStep(currentStep);

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: {
        user_id: userId,
      },
      update: {},
      create: {
        user_id: userId,
      },
    });

    await tx.userPrompt.deleteMany({
      where: {
        userId,
      },
    });

    await tx.userPrompt.createMany({
      data: prompts.map((item, index) => ({
        userId,
        promptId: item.promptId,
        answer: item.answer.trim(),
        displayOrder: index + 1,
      })),
    });

    await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        onboarding_step: currentStep,
        next_step: nextStep,
      },
    });
  });

  const result = await prisma.userPrompt.findMany({
    where: {
      userId,
    },
    include: {
      prompt: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      displayOrder: "asc",
    },
  });

  await queueMatchScoreCalculation(userId);

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);

  return {
    prompts: result,
    onboarding_step: currentStep,
    next_step: nextStep,
  };
};

// Complete Onboarding Service
export const completeOnboardingService = async (userId: string) => {
  if (!userId) throw new Error("User ID is missing");

  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      onboarding_completed: true,
      onboarding_step: "REVIEW_FINISH",
      next_step: "COMPLETED",
    },
  });

  // Credit referral reward if applicable
  try {
    await ReferralService.onRegistrationCompleted(userId);
    console.log("Funtion call ......");
  } catch (error) {
    console.error("Referral registration reward failed:", error);
  }

  await queueMatchScoreCalculation(
    userId,
  );

  await redis.del(`profile:edit:${userId}`);
  await redis.del(`feed:details:${userId}`);
  return user;
};
