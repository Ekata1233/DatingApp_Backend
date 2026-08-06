import { MediaType, QuestionCategory, QuestionScreen } from "@prisma/client";
import { prisma } from "../../../../prisma/prismaClient";
import {
  updateUserData,
  upsertUserProfile,
  findQuestionByKey,
  deleteExistingAnswers,
  createUserAnswers,
  upsertUserBio,
  validateQuestionOptions,
  replaceUserAnswers,
  getEditProfileRepository,
} from "./editProfile.repository";
import * as userEduWorkRepository from "./editProfile.service";
import { EditProfileResponse } from "./editProfile.types";
import { redis } from "../../../../lib/redis";


const CACHE_TTL = 604800;

//--------------------------------BASIC INFO UPDATE--------------------------------

export const updateBasicInfoService = async (userId: string, payload: any) => {
  const {
    full_name,
    email,
    birth_date,
    height,
    gender,

    religionId,
    communityId,
    languageIds,

    zodiac,
    loveLanguage,
    communicationStyle,
  } = payload;

  const result = await prisma.$transaction(async (tx) => {
    //--------------------------------------------------
    // USER
    //--------------------------------------------------

    const userData: any = {};

    if (full_name !== undefined) userData.full_name = full_name;

    if (email !== undefined) userData.email = email;

    if (birth_date !== undefined) userData.birth_date = new Date(birth_date);

    if (height !== undefined) userData.height = height;

    if (gender !== undefined) userData.gender = gender;

    if (Object.keys(userData).length) {
      await tx.user.update({
        where: {
          id: userId,
        },
        data: userData,
      });
    }

    //--------------------------------------------------
    // USER PROFILE
    //--------------------------------------------------

    await tx.userProfile.upsert({
      where: {
        user_id: userId,
      },
      create: {
        user_id: userId,
        religionId,
        communityId,
      },
      update: {
        religionId,
        communityId,
      },
    });

    //--------------------------------------------------
    // LANGUAGES
    //--------------------------------------------------

    if (Array.isArray(languageIds)) {
      await tx.userLanguage.deleteMany({
        where: {
          userId,
        },
      });

      if (languageIds.length) {
        await tx.userLanguage.createMany({
          data: languageIds.map((id: number) => ({
            userId,
            languageId: id,
          })),
        });
      }
    }

    //--------------------------------------------------
    // USER ABOUT
    //--------------------------------------------------

    await tx.userAbout.upsert({
      where: {
        user_id: userId,
      },
      create: {
        user_id: userId,
        zodiac,
        loveLanguage,
        communicationStyle,
      },
      update: {
        zodiac,
        loveLanguage,
        communicationStyle,
      },
    });

    //--------------------------------------------------

    return {
      message: "Basic information updated successfully.",
    };
  });

  // Clear cache only after a successful transaction
  await redis.del(`profile:edit:${userId}`);

  console.log("🗑️ Edit profile cache cleared");

  return result;

};

//aboutme
export const updateBioService = async (userId: string, bio: string) => {
  const updatedBio = await upsertUserBio(userId, bio);
  await redis.del(`profile:edit:${userId}`);
  return updatedBio;
};

// --------------------------------USER EDUCATION AND WORK UPDATE-------------------------------
// export const updateUserEduWork = async (
//   userId: string,
//   body: any
// ) => {
//   const existingUser = await prisma.user.findUnique({
//     where: {
//       id: userId,
//     },
//   });

//   if (!existingUser) {
//     throw new Error("User not found");
//   }

//   const {
//     highestEdu,
//     degree,
//     collegeName,
//     graduationYear,
//     workingWith,
//     workingAs,
//     companyName,
//     workStyle,
//     incomeRange,
//     minIncome,
//     maxIncome,
//     skills,
//   } = body;

//   // update edu/work
//   const updatedEduWork =
//     await userEduWorkRepository.updateUserEduWork(userId, {
//       highestEdu,
//       degree,
//       collegeName,
//       graduationYear,
//       workingWith,
//       workingAs,
//       companyName,
//       workStyle,
//       incomeRange,
//       minIncome,
//       maxIncome,
//     });

//   // update skills
//   if (Array.isArray(skills)) {
//     await userEduWorkRepository.deleteUserSkills(userId);

//     for (const skillId of skills) {
//       await userEduWorkRepository.createUserSkill({
//         userId,
//         skillId,
//       });
//     }
//   }

//   const finalData =
//     await userEduWorkRepository.getUserEduWorkByUserId(userId);

//   return finalData;
// };

export const updateQuestionAnswersService = async (
  userId: string,
  payload: {
    questionKey: string;
    optionIds: string[];
    description?: string;
  },
) => {
  const { questionKey, optionIds, description } = payload;

  const result = await prisma.$transaction(async (tx) => {
    //-----------------------------------
    // Find Question
    //-----------------------------------

    const question = await tx.question.findUnique({
      where: {
        key: questionKey,
      },
      include: {
        options: true,
      },
    });

    if (!question) {
      throw new Error("Question not found.");
    }

    //-----------------------------------
    // Validate Options
    //-----------------------------------

    const validOptionIds = question.options.map((o) => o.id);

    const invalidOptions = optionIds.filter(
      (id) => !validOptionIds.includes(id),
    );

    if (invalidOptions.length) {
      throw new Error("Invalid option selected.");
    }

    //-----------------------------------
    // Delete Old Answers
    //-----------------------------------

    await tx.userAnswer.deleteMany({
      where: {
        user_id: userId,
        question_id: question.id,
      },
    });

    //-----------------------------------
    // Insert New Answers
    //-----------------------------------

    if (optionIds.length) {
      await tx.userAnswer.createMany({
        data: optionIds.map((optionId) => ({
          user_id: userId,
          question_id: question.id,
          option_id: optionId,
          description, // Added only this line
        })),
      });
    }

    //-----------------------------------

    return {
      message: "Question updated successfully.",
    };
  });

  await redis.del(`profile:edit:${userId}`);

  return result;
};

export const updateEduWorkService = async (userId: string, payload: any) => {
  const result = await prisma.$transaction(async (tx) => {
    // Optional FK validation

    if (payload.professionId) {
      const profession = await tx.profession.findUnique({
        where: { id: payload.professionId },
      });

      if (!profession) {
        throw new Error("Invalid profession.");
      }
    }

    if (payload.employmentTypeId) {
      const employment = await tx.employmentType.findUnique({
        where: { id: payload.employmentTypeId },
      });

      if (!employment) {
        throw new Error("Invalid employment type.");
      }
    }

    if (payload.experienceId) {
      const experience = await tx.experience.findUnique({
        where: { id: payload.experienceId },
      });

      if (!experience) {
        throw new Error("Invalid experience.");
      }
    }

    if (payload.ambitionId) {
      const ambition = await tx.ambition.findUnique({
        where: { id: payload.ambitionId },
      });

      if (!ambition) {
        throw new Error("Invalid ambition.");
      }
    }

    if (payload.salaryRangeId) {
      const salary = await tx.salaryRange.findUnique({
        where: { id: payload.salaryRangeId },
      });

      if (!salary) {
        throw new Error("Invalid salary range.");
      }
    }

    const data: any = {};

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== undefined) {
        data[key] = payload[key];
      }
    });

    await tx.userEduWork.upsert({
      where: {
        userId,
      },
      create: {
        userId,
        ...data,
      },
      update: data,
    });

    return {
      message: "Education & Work updated successfully.",
    };
  });

  await redis.del(`profile:edit:${userId}`);

  return result;
};

export const updateUserPromptService = async (userId: string, payload: any) => {
  const { categoryId, promptId, answer, displayOrder } = payload;

  const result = await prisma.$transaction(async (tx) => {
    // Validate Category
    const category = await tx.promptCategory.findUnique({
      where: {
        id: categoryId,
      },
    });

    if (!category) {
      throw new Error("Category not found.");
    }

    // Validate Prompt belongs to Category
    const prompt = await tx.prompt.findFirst({
      where: {
        id: promptId,
        categoryId: categoryId,
        active: true,
      },
    });

    if (!prompt) {
      throw new Error("Selected prompt does not belong to this category.");
    }

    // Create or Update User Prompt
    const userPrompt = await tx.userPrompt.upsert({
      where: {
        userId_promptId: {
          userId,
          promptId,
        },
      },
      create: {
        userId,
        promptId,
        answer,
        displayOrder: displayOrder ?? 1,
      },
      update: {
        answer,
        ...(displayOrder !== undefined && {
          displayOrder,
        }),
      },
      include: {
        prompt: {
          include: {
            category: true,
          },
        },
      },
    });

    return {
      message: "Prompt updated successfully.",
      data: userPrompt,
    };
  });

  await redis.del(`profile:edit:${userId}`);

  return result;
};

export const updateLocationService = async (
  userId: string,
  payload: any
) => {
  const result = await prisma.$transaction(async (tx) => {

    const profileData: any = {};

    if (payload.country !== undefined)
      profileData.country = payload.country;

    if (payload.state !== undefined)
      profileData.state = payload.state;

    if (payload.city !== undefined)
      profileData.city = payload.city;

    if (payload.area !== undefined)
      profileData.area = payload.area;

    if (payload.latitude !== undefined)
      profileData.latitude = payload.latitude;

    if (payload.longitude !== undefined)
      profileData.longitude = payload.longitude;

    if (payload.max_distance_km !== undefined)
      profileData.max_distance_km = payload.max_distance_km;

    await tx.userProfile.upsert({
      where: {
        user_id: userId,
      },
      create: {
        user_id: userId,
        ...profileData,
      },
      update: profileData,
    });

    return {
      message: "Location updated successfully.",
    };
  });

  await redis.del(`profile:edit:${userId}`);

  return result;
};

export const deleteUserPromptService = async (
  userId: string,
  promptId: string
) => {
  const userPrompt = await prisma.userPrompt.findUnique({
    where: {
      userId_promptId: {
        userId,
        promptId,
      },
    },
  });

  if (!userPrompt) {
    throw new Error("Prompt not found.");
  }

  const result = await prisma.userPrompt.delete({
    where: {
      userId_promptId: {
        userId,
        promptId,
      },
    },
  });

  await redis.del(`profile:edit:${userId}`);

  return result;
};

function formatDate(date: Date | null): string | null {
  if (!date) return null;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

export async function getEditProfileService(
  userId: string
): Promise<EditProfileResponse> {
  const CACHE_KEY = `profile:edit:${userId}`;

  // 1. Check Redis
  const cachedProfile = await redis.get<EditProfileResponse>(CACHE_KEY);

  if (cachedProfile) {
    console.log("✅ Edit Profile from Redis");
    return cachedProfile;
  }

  console.log("📦 Edit Profile from Database");

  const profile = await getEditProfileRepository(userId);

  if (!profile) {
    throw new Error("Profile not found");
  }

  const photos = profile.photos
    .filter((item) => item.media_type === MediaType.IMAGE)
    .map((item) => ({
      id: item.id,
      url: item.media_url,
      order: item.order,
      isPrimary: item.is_primary,
    }));

  const videoItem =
    profile.photos.find((item) => item.media_type === MediaType.VIDEO) ?? null;

  const lifestyle = profile.answer
    .filter(item => item.question.screen === QuestionScreen.LIFESTYLE)
    .map(item => ({
      id: item.option.id,
      question: item.question.title,
      option: item.option.label,
    }));

  const interests = profile.answer
    .filter(item => item.question.screen === QuestionScreen.THINGS_U_LOVE)
    .map(item => ({
      id: item.option.id,
      question: item.question.title,
      option: item.option.label,
    }));

  const networkingIntent = profile.answer
    .filter(item => item.question.screen === QuestionScreen.NETWORKING_INTENT)
    .map(item => ({
      id: item.option.id,
      question: item.question.title,
      option: item.option.label,
    }));

  const response: EditProfileResponse = {
    profileScore: profile.profile_completion ?? 0,
    basicDetails: {
      fullName: profile.full_name,
      email: profile.email,
      phoneNumber: profile.phone_number,
      birthDate: formatDate(profile.birth_date),
      height: profile.height,
      gender: profile.gender,
      genderOption: profile.gender_option,
      religion: profile.profile?.religion ? {
        id: profile.profile.religion.id,
        name: profile.profile.religion.name,
      } : null,
      languages:
        profile.profile?.languages?.map((item) => ({
          id: item.language.id,
          name: item.language.name,
        })) ?? [],
      community: profile.profile?.community ? {
        id: profile.profile.community.id,
        name: profile.profile.community.name,
      } : null,
      zodiac: profile.about?.zodiac ?? null,
      loveLanguage: profile.about?.loveLanguage ?? null,
      communicationStyle: profile.about?.communicationStyle ?? null,
    },

    photos,

    video: videoItem
      ? {
        id: videoItem.id,
        url: videoItem.media_url,
      }
      : null,

    bio: {
      bio: profile.bio?.bio ?? null,
    },

    lookingFor: {
      id: profile.intention?.id ?? null,
      option: profile.intention?.option ?? null,
      description: profile.intention?.optDescription ?? null,
    },
    profile: {
      interestedIn: profile.profile?.interested_in ?? null,
      sexualOrientation: profile.profile?.sexual_orientation ?? null,

    },

    educationCareer: profile.eduWork
      ? {
        highestEducation: profile.eduWork.highestEdu,
        degree: profile.eduWork.degree,
        collegeName: profile.eduWork.collegeName,
        graduationYear: profile.eduWork.graduationYear,

        profession: profile.eduWork.profession
          ? {
            id: profile.eduWork.profession.id,
            name: profile.eduWork.profession.name,
          }
          : null,

        companyName: profile.eduWork.companyName,

        employmentType: profile.eduWork.employmentType
          ? {
            id: profile.eduWork.employmentType.id,
            name: profile.eduWork.employmentType.name,
          }
          : null,

        experience: profile.eduWork.experience
          ? {
            id: profile.eduWork.experience.id,
            title: profile.eduWork.experience.title,
          }
          : null,

        ambition: profile.eduWork.ambition
          ? {
            id: profile.eduWork.ambition.id,
            title: profile.eduWork.ambition.title,
          }
          : null,

        salaryRange: profile.eduWork.salaryRange
          ? {
            id: profile.eduWork.salaryRange.id,
            title: profile.eduWork.salaryRange.title,
          }
          : null,

        bigDreams: profile.eduWork.bigDreams,
      }
      : null,

    family: profile.familyProfile
      ? {
        // ✅ Transform MasterValue relations properly
        familyStatus: profile.familyProfile.familyStatus ? {
          id: profile.familyProfile.familyStatus.id,
          value: profile.familyProfile.familyStatus.value,
        } : null,

        familyType: profile.familyProfile.familyType ? {
          id: profile.familyProfile.familyType.id,
          value: profile.familyProfile.familyType.value,
        } : null,

        fatherOccupation: profile.familyProfile.fatherOccupation ? {
          id: profile.familyProfile.fatherOccupation.id,
          value: profile.familyProfile.fatherOccupation.value,
        } : null,

        fatherOrganisation: profile.familyProfile.fatherOrganisation ? {
          id: profile.familyProfile.fatherOrganisation.id,
          value: profile.familyProfile.fatherOrganisation.value,
        } : null,

        motherOccupation: profile.familyProfile.motherOccupation ? {
          id: profile.familyProfile.motherOccupation.id,
          value: profile.familyProfile.motherOccupation.value,
        } : null,

        motherOrganisation: profile.familyProfile.motherOrganisation ? {
          id: profile.familyProfile.motherOrganisation.id,
          value: profile.familyProfile.motherOrganisation.value,
        } : null,

        familyHome: profile.familyProfile.familyHome ? {
          id: profile.familyProfile.familyHome.id,
          value: profile.familyProfile.familyHome.value,
        } : null,

        nativePlace: profile.familyProfile.nativePlace ? {
          id: profile.familyProfile.nativePlace.id,
          value: profile.familyProfile.nativePlace.value,
        } : null,

        familyIncome: profile.familyProfile.familyIncome ? {
          id: profile.familyProfile.familyIncome.id,
          title: profile.familyProfile.familyIncome.title,
        } : null,

        // ✅ Use the actual UUID from UserSibling
        siblings: profile.familyProfile.siblings.map((item) => ({
          id: item.id,
          relation: item.relation ? {
            id: item.relation.id,
            value: item.relation.value,
          } : null,
          occupation: item.occupation ? {
            id: item.occupation.id,
            value: item.occupation.value,
          } : null,
          maritalStatus: item.marital ? {
            id: item.marital.id,
            value: item.marital.value,
          } : null,
        })),
      }
      : null,

    lifestyle,
    interests,
    networkingIntent,

    prompts: profile.userPrompts.map((item) => ({
      id: item.id,
      promptId: item.prompt.id,
      question: item.prompt.question,
      answer: item.answer,
      displayOrder: item.displayOrder,
    })),
    location: {
      country: profile.profile?.country,
      state: profile.profile?.state,
      city: profile.profile?.city,
      area: profile.profile?.area,

      latitude: profile.profile?.latitude
        ? Number(profile.profile.latitude)
        : null,

      longitude: profile.profile?.longitude
        ? Number(profile.profile.longitude)
        : null,

      maxDistanceKm:
        profile.profile?.max_distance_km,
    },
  };

  // 3. Save to Redis
  await redis.set(CACHE_KEY, response, {
    ex: CACHE_TTL,
  });

  console.log("💾 Edit Profile cached");

  return response;

}