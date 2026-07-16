// // utils/profileScore.ts

// import { QuestionScreen } from "@prisma/client";
// import { PROFILE_WEIGHTS } from "../config/profileCompletion";
// import { prisma } from "../prisma/prismaClient";

// export const calculateProfileScore = async (userId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId },
//   });

//   const profile = await prisma.userProfile.findUnique({
//     where: { user_id: userId },
//   });

//   const photos = await prisma.userPhoto.count({
//     where: { user_id: userId },
//   });

//   const questionCounts = await prisma.question.groupBy({
//   by: ["screen"],
//   _count: {
//     id: true,
//   },
// });

//   const answers = await prisma.userAnswer.findMany({
//     where: { user_id: userId },
//     include: {
//       question: {
//         select: {
//         category: true,
//         screen: true, // ✅ ADD THIS
//       },
//       },
//     },
//   });

//   const userBio = await prisma.userBio.findUnique({
//     where: { user_id: userId },
//     select: { bio: true },
//   });

//   // -------------------------------
//   // BASIC DETAILS
//   // -------------------------------
//   let basicScore = 0;
//   if (user?.full_name) basicScore += 2;
//   if (user?.email) basicScore += 2;
//   if (user?.birth_date) basicScore += 2;
//   if (user?.height) basicScore += 2;
//   if (user?.gender) basicScore += 2;
//    if (user?.gender_option) basicScore += 2;

//   // max = 
//   basicScore = Math.min(basicScore, PROFILE_WEIGHTS.basic_details);

//   // -------------------------------
//   // LOCATION
//   // -------------------------------
//   const locationScore =
//     profile?.latitude && profile?.longitude ? PROFILE_WEIGHTS.location : 0;

//   // -------------------------------
//   // ADDRESS
//   // -------------------------------
//   const addressFields = [profile?.country, profile?.state, profile?.city];
//   const addressFilled = addressFields.filter(Boolean).length;

//   const addressScore =
//     (addressFilled / 3) * PROFILE_WEIGHTS.address;

//   // -------------------------------
//   // INTERESTED IN
//   // -------------------------------
//   const interestedScore =
//     profile?.interested_in && profile?.sexual_orientation
//       ? PROFILE_WEIGHTS.interested_in
//       : 0;

//   // -------------------------------
//   // QUESTIONS (group by category)
//   // -------------------------------
// const lifestyleAnswers = new Set(
//   answers
//     .filter((a) => a.question.screen === QuestionScreen.LIFESTYLE)
//     .map((a) => a.question_id)
// ).size;

// const realYouAnswers = new Set(
//   answers
//     .filter((a) => a.question.screen === QuestionScreen.REAL_U_MATTERS)
//     .map((a) => a.question_id)
// ).size;

// const thingsYouLoveAnswers = new Set(
//   answers
//     .filter((a) => a.question.screen === QuestionScreen.THINGS_U_LOVE)
//     .map((a) => a.question_id)
// ).size;



// const screenTotals = questionCounts.reduce((acc, item) => {
//   acc[item.screen] = item._count.id;
//   return acc;
// }, {} as Record<QuestionScreen, number>);

// const TOTAL_LIFESTYLE = screenTotals[QuestionScreen.LIFESTYLE] || 0;

// const TOTAL_REALYOU =
//   screenTotals[QuestionScreen.REAL_U_MATTERS] || 0;

// const TOTAL_THINGS_YOU_LOVE =
//   (screenTotals[QuestionScreen.THINGS_U_LOVE] || 0);


// const lifestyleScore =
//   TOTAL_LIFESTYLE > 0
//     ? (lifestyleAnswers / TOTAL_LIFESTYLE) * PROFILE_WEIGHTS.lifestyle
//     : 0;

// const realYouScore =
//   TOTAL_REALYOU > 0
//     ? (realYouAnswers / TOTAL_REALYOU) * PROFILE_WEIGHTS.real_you
//     : 0;

// const thingsYouLoveScore =
//   TOTAL_THINGS_YOU_LOVE > 0
//     ? (thingsYouLoveAnswers / TOTAL_THINGS_YOU_LOVE) *
//       PROFILE_WEIGHTS.things_you_love
//     : 0;


//   // -------------------------------
//   // PHOTOS
//   // -------------------------------
//   const photoScore =
//     (Math.min(photos, 5) / 5) * PROFILE_WEIGHTS.photos;

//   // -------------------------------
//   // BIO
//   // -------------------------------
//   const bioText = userBio?.bio || "";

// let bioScore = 0;

// if (bioText.length >= 80) {
//   bioScore = PROFILE_WEIGHTS.bio; // full
// } else if (bioText.length >= 30) {
//   bioScore = PROFILE_WEIGHTS.bio * 0.7;
// } else if (bioText.length > 0) {
//   bioScore = PROFILE_WEIGHTS.bio * 0.4;
// }


//   // -------------------------------
//   // FINAL SCORE
//   // -------------------------------
//   const totalScore =
//     basicScore +
//     locationScore +
//     addressScore +
//     interestedScore +
//     lifestyleScore +
//     realYouScore +
//     thingsYouLoveScore +
//     photoScore +
//     bioScore;

//   return Math.round(totalScore);
// };

// utils/profileScore.ts

import { QuestionScreen } from "@prisma/client";
import { prisma } from "../prisma/prismaClient";
import { PROFILE_WEIGHTS } from "../config/profileCompletion";

export const calculateProfileScore = async (userId: string) => {
  const [
    user,
    profile,
    education,
    family,
    userBio,
    photosCount,
    promptsCount,
    answers,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
    }),

    prisma.userProfile.findUnique({
      where: { user_id: userId },
      include: {
        languages: true,
      },
    }),

    prisma.userEduWork.findUnique({
      where: { userId: userId },
    }),

    prisma.userFamilyProfile.findUnique({
      where: { userId: userId },
    }),

    prisma.userBio.findUnique({
      where: { user_id: userId },
    }),

    prisma.userPhoto.count({
      where: { user_id: userId },
    }),

    prisma.userPrompt.count({
      where: { userId: userId },
    }),

    prisma.userAnswer.findMany({
      where: {
        user_id: userId,
      },
      include: {
        question: {
          select: {
            screen: true,
          },
        },
      },
    }),
  ]);

  let score = 0;

  // =========================================================
  // PHONE VERIFICATION
  // =========================================================

  if (user?.is_phone_verified) {
    score += PROFILE_WEIGHTS.PHONE_VERIFICATION;
  }

  // =========================================================
  // BASIC INFO (15)
  // =========================================================

  if (user?.full_name)
    score += PROFILE_WEIGHTS.BASIC_INFO.FULL_NAME;

  if (user?.email)
    score += PROFILE_WEIGHTS.BASIC_INFO.EMAIL;

  if (user?.birth_date)
    score += PROFILE_WEIGHTS.BASIC_INFO.BIRTH_DATE;

  if (user?.height)
    score += PROFILE_WEIGHTS.BASIC_INFO.HEIGHT;

  if (user?.gender)
    score += PROFILE_WEIGHTS.BASIC_INFO.GENDER;

  if (user?.gender_option)
    score += PROFILE_WEIGHTS.BASIC_INFO.GENDER_OPTION;

  if (user?.intentionId)
    score += PROFILE_WEIGHTS.PROFILE.INTENTION;

  // =========================================================
  // PROFILE (13)
  // =========================================================

  if (profile?.religionId)
    score += PROFILE_WEIGHTS.PROFILE.RELIGION;

  if (profile?.communityId)
    score += PROFILE_WEIGHTS.PROFILE.COMMUNITY;

  if (profile?.interested_in)
    score += PROFILE_WEIGHTS.PROFILE.INTERESTED_IN;

  if (profile?.sexual_orientation)
    score += PROFILE_WEIGHTS.PROFILE.SEXUAL_ORIENTATION;

  if (profile?.country)
    score += PROFILE_WEIGHTS.PROFILE.COUNTRY;

  if (profile?.state)
    score += PROFILE_WEIGHTS.PROFILE.STATE;

  if (profile?.city)
    score += PROFILE_WEIGHTS.PROFILE.CITY;

  
  if (profile?.latitude && profile?.longitude)
    score += PROFILE_WEIGHTS.PROFILE.LOCATION_COORDINATES;

  if (profile?.languages.length) {
    score += PROFILE_WEIGHTS.PROFILE.LANGUAGES;
  }

  // =========================================================
  // EDUCATION & WORK (12)
  // =========================================================

  if (education?.highestEdu)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.HIGHEST_EDUCATION;

  if (education?.degree)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.DEGREE;

  if (education?.collegeName)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.COLLEGE;

  if (education?.graduationYear)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.YEAR_OF_PASSING;

  if (education?.professionId)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.PROFESSION;

  if (education?.companyName)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.COMPANY;

  if (education?.employmentTypeId)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.EMPLOYMENT_TYPE;

  if (education?.experienceId)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.EXPERIENCE;

  if (education?.ambitionId)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.AMBITION;

  if (education?.salaryRangeId)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.SALARY_RANGE;

  if (education?.bigDreams)
    score += PROFILE_WEIGHTS.EDUCATION_WORK.BIG_DREAMS;

  // =========================================================
  // FAMILY (10)
  // =========================================================

  if (family?.familyStatusId)
    score += PROFILE_WEIGHTS.FAMILY.FAMILY_STATUS;

  if (family?.familyTypeId)
    score += PROFILE_WEIGHTS.FAMILY.FAMILY_TYPE;

  if (family?.fatherOccupationId)
    score += PROFILE_WEIGHTS.FAMILY.FATHER_OCCUPATION;

  if (family?.fatherOrganisationId)
    score += PROFILE_WEIGHTS.FAMILY.FATHER_ORGANIZATION;

  if (family?.motherOccupationId)
    score += PROFILE_WEIGHTS.FAMILY.MOTHER_OCCUPATION;

  if (family?.motherOrganisationId)
    score += PROFILE_WEIGHTS.FAMILY.MOTHER_ORGANIZATION;

  if (family?.siblingRelationId)
    score += PROFILE_WEIGHTS.FAMILY.SIBLING_RELATION;

  if (family?.siblingOccupationId)
    score += PROFILE_WEIGHTS.FAMILY.SIBLING_OCCUPATION;

  if (family?.familyHomeId)
    score += PROFILE_WEIGHTS.FAMILY.FAMILY_CITY;

  if (family?.familyIncomeId)
    score += PROFILE_WEIGHTS.FAMILY.FAMILY_INCOME;

  // =========================================================
  // INTERESTS (10)
  // =========================================================

  const interestsAnswered = new Set(
    answers
      .filter((a: any) => a.question.screen === QuestionScreen.THINGS_U_LOVE)
      .map((a: any) => a.question_id)
  ).size;

  switch (Math.min(interestsAnswered, 6)) {
    case 1:
      score += PROFILE_WEIGHTS.INTERESTS.ONE;
      break;
    case 2:
      score += PROFILE_WEIGHTS.INTERESTS.TWO;
      break;
    case 3:
      score += PROFILE_WEIGHTS.INTERESTS.THREE;
      break;
    case 4:
      score += PROFILE_WEIGHTS.INTERESTS.FOUR;
      break;
    case 5:
      score += PROFILE_WEIGHTS.INTERESTS.FIVE;
      break;
    case 6:
      score += PROFILE_WEIGHTS.INTERESTS.SIX;
      break;
  }

  // =========================================================
  // LIFESTYLE (5)
  // =========================================================

  const lifestyleAnswered = new Set(
    answers
      .filter((a: any) => a.question.screen === QuestionScreen.LIFESTYLE)
      .map((a: any) => a.question_id)
  ).size;

  switch (Math.min(lifestyleAnswered, 5)) {
    case 1:
      score += PROFILE_WEIGHTS.LIFESTYLE.ONE;
      break;
    case 2:
      score += PROFILE_WEIGHTS.LIFESTYLE.TWO;
      break;
    case 3:
      score += PROFILE_WEIGHTS.LIFESTYLE.THREE;
      break;
    case 4:
      score += PROFILE_WEIGHTS.LIFESTYLE.FOUR;
      break;
    case 5:
      score += PROFILE_WEIGHTS.LIFESTYLE.FIVE;
      break;
  }

  // =========================================================
  // PROMPTS (5)
  // =========================================================

  switch (Math.min(promptsCount, 3)) {
    case 1:
      score += PROFILE_WEIGHTS.PROMPTS.ONE;
      break;
    case 2:
      score += PROFILE_WEIGHTS.PROMPTS.TWO;
      break;
    case 3:
      score += PROFILE_WEIGHTS.PROMPTS.THREE;
      break;
  }

  // =========================================================
  // PHOTOS (15)
  // =========================================================

  switch (Math.min(photosCount, 5)) {
    case 1:
      score += PROFILE_WEIGHTS.PHOTOS.ONE_PHOTO;
      break;
    case 2:
      score += PROFILE_WEIGHTS.PHOTOS.ONE_PHOTO + PROFILE_WEIGHTS.PHOTOS.TWO_PHOTOS;
      break;
    case 3:
      score +=
        PROFILE_WEIGHTS.PHOTOS.ONE_PHOTO +
        PROFILE_WEIGHTS.PHOTOS.TWO_PHOTOS +
        PROFILE_WEIGHTS.PHOTOS.THREE_PHOTOS;
      break;
    case 4:
      score +=
        PROFILE_WEIGHTS.PHOTOS.ONE_PHOTO +
        PROFILE_WEIGHTS.PHOTOS.TWO_PHOTOS +
        PROFILE_WEIGHTS.PHOTOS.THREE_PHOTOS +
        PROFILE_WEIGHTS.PHOTOS.FOUR_PHOTOS;
      break;
    default:
      if (photosCount >= 5) {
        score += PROFILE_WEIGHTS.PHOTOS.TOTAL;
      }
  }

  // =========================================================
  // BIO (10)
  // =========================================================

  const bioLength = userBio?.bio?.trim().length ?? 0;

  if (bioLength >= 100)
    score += PROFILE_WEIGHTS.BIO.MIN_100_CHARS;
  else if (bioLength >= 50)
    score += PROFILE_WEIGHTS.BIO.MIN_50_CHARS;
  else if (bioLength >= 20)
    score += PROFILE_WEIGHTS.BIO.MIN_20_CHARS;

  // =========================================================
  // FINAL
  // =========================================================

  return Math.min(score, PROFILE_WEIGHTS.TOTAL_SCORE);
};