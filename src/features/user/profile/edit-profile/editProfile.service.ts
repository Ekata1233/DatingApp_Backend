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
} from "./editProfile.repository";
import * as userEduWorkRepository from "./editProfile.service";

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

  return await prisma.$transaction(async (tx) => {
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
};

//aboutme
export const updateBioService = async (userId: string, bio: string) => {
  const updatedBio = await upsertUserBio(userId, bio);

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
  },
) => {
  const { questionKey, optionIds } = payload;

  return await prisma.$transaction(async (tx) => {
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
        })),
      });
    }

    //-----------------------------------

    return {
      message: "Question updated successfully.",
    };
  });
};

export const updateEduWorkService = async (userId: string, payload: any) => {
  return await prisma.$transaction(async (tx) => {
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
};

export const updateUserPromptService = async (userId: string, payload: any) => {
  const { categoryId, promptId, answer, displayOrder } = payload;

  return await prisma.$transaction(async (tx) => {
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
};

export const updateLocationService = async (
  userId: string,
  payload: any
) => {
  return await prisma.$transaction(async (tx) => {

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
};