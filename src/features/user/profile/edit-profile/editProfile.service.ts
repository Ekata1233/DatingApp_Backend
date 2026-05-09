import { prisma } from "../../../../prisma/prismaClient";
import {
  updateUserData,
  upsertUserProfile,
  findQuestionByKey,
  deleteExistingAnswers,
  createUserAnswers,
  upsertUserBio
} from "./editProfile.repository";
import * as userEduWorkRepository from "./editProfile.service";



//--------------------------------BASIC INFO UPDATE--------------------------------
export const updateBasicInfoService = async (
  userId: string,
  payload: any
) => {
  const {
    full_name,
    birth_date,
    height,
    city,
    religion,
    community,
    interested_in,
    love_language
  } = payload;

  //-----------------------------------
  // USER TABLE UPDATE
  //-----------------------------------
  const userData: any = {};

  if (full_name) userData.full_name = full_name;
  if (birth_date) userData.birth_date = new Date(birth_date);
  if (height) userData.height = height;

  if (Object.keys(userData).length > 0) {
    await updateUserData(userId, userData);
  }

  //-----------------------------------
  // USER PROFILE UPSERT
  //-----------------------------------
  const profileData: any = {};

  if (city) profileData.city = city;
  if (religion) profileData.religion = religion;
  if (community) profileData.community = community;
  if (interested_in)
    profileData.interested_in = interested_in;

  if (Object.keys(profileData).length > 0) {
    await upsertUserProfile(userId, profileData);
  }

  //-----------------------------------
  // LOVE LANGUAGE UPDATE
  //-----------------------------------
  if (love_language?.length) {
    const question = await findQuestionByKey(
      "love_language"
    );

    if (!question) {
      throw new Error(
        "Love language question not found"
      );
    }

    const optionIds = question.options
      .filter((option) =>
        love_language.includes(option.value)
      )
      .map((option) => option.id);

    await deleteExistingAnswers(
      userId,
      question.id
    );

    await createUserAnswers(
      optionIds.map((optionId) => ({
        user_id: userId,
        question_id: question.id,
        option_id: optionId
      }))
    );
  }

  //-----------------------------------
  // RETURN UPDATED DATA
  //-----------------------------------
  return {
    message: "Basic info updated successfully"
  };
};


//aboutme 
export const updateBioService = async (
  userId: string,
  bio: string
) => {
  const updatedBio = await upsertUserBio(
    userId,
    bio
  );

  return updatedBio;
};

// --------------------------------USER EDUCATION AND WORK UPDATE-------------------------------
export const updateUserEduWork = async (
  userId: string,
  body: any
) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const {
    highestEdu,
    degree,
    collegeName,
    graduationYear,
    workingWith,
    workingAs,
    companyName,
    workStyle,
    incomeRange,
    minIncome,
    maxIncome,
    skills,
  } = body;

  // update edu/work
  const updatedEduWork =
    await userEduWorkRepository.updateUserEduWork(userId, {
      highestEdu,
      degree,
      collegeName,
      graduationYear,
      workingWith,
      workingAs,
      companyName,
      workStyle,
      incomeRange,
      minIncome,
      maxIncome,
    });

  // update skills
  if (Array.isArray(skills)) {
    await userEduWorkRepository.deleteUserSkills(userId);

    for (const skillId of skills) {
      await userEduWorkRepository.createUserSkill({
        userId,
        skillId,
      });
    }
  }

  const finalData =
    await userEduWorkRepository.getUserEduWorkByUserId(userId);

  return finalData;
};