// utils/profileScore.ts

import { QuestionScreen } from "@prisma/client";
import { PROFILE_WEIGHTS } from "../config/profileCompletion";
import { prisma } from "../prisma/prismaClient";

export const calculateProfileScore = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const profile = await prisma.userProfile.findUnique({
    where: { user_id: userId },
  });

  const photos = await prisma.userPhoto.count({
    where: { user_id: userId },
  });

  const questionCounts = await prisma.question.groupBy({
  by: ["screen"],
  _count: {
    id: true,
  },
});

  const answers = await prisma.userAnswer.findMany({
    where: { user_id: userId },
    include: {
      question: {
        select: {
        category: true,
        screen: true, // ✅ ADD THIS
      },
      },
    },
  });

  const userBio = await prisma.userBio.findUnique({
    where: { user_id: userId },
    select: { bio: true },
  });

  // -------------------------------
  // BASIC DETAILS
  // -------------------------------
  let basicScore = 0;
  if (user?.full_name) basicScore += 2;
  if (user?.email) basicScore += 2;
  if (user?.birth_date) basicScore += 2;
  if (user?.height) basicScore += 2;
  if (user?.gender) basicScore += 2;
   if (user?.gender_option) basicScore += 2;

  // max = 12
  basicScore = Math.min(basicScore, PROFILE_WEIGHTS.dating.basic_details);

  // -------------------------------
  // LOCATION
  // -------------------------------
  const locationScore =
    profile?.latitude && profile?.longitude ? PROFILE_WEIGHTS.dating.location : 0;

  // -------------------------------
  // ADDRESS
  // -------------------------------
  const addressFields = [profile?.country, profile?.state, profile?.city];
  const addressFilled = addressFields.filter(Boolean).length;

  const addressScore =
    (addressFilled / 3) * PROFILE_WEIGHTS.dating.address;

  // -------------------------------
  // INTERESTED IN
  // -------------------------------
  const interestedScore =
    profile?.interested_in && profile?.sexual_orientation
      ? PROFILE_WEIGHTS.dating.interested_in
      : 0;

  // -------------------------------
  // QUESTIONS (group by category)
  // -------------------------------
const lifestyleAnswers = new Set(
  answers
    .filter((a) => a.question.screen === QuestionScreen.LIFESTYLE)
    .map((a) => a.question_id)
).size;

const realYouAnswers = new Set(
  answers
    .filter((a) => a.question.screen === QuestionScreen.REAL_U_MATTERS)
    .map((a) => a.question_id)
).size;

const thingsYouLoveAnswers = new Set(
  answers
    .filter((a) => a.question.screen === QuestionScreen.THINGS_U_LOVE)
    .map((a) => a.question_id)
).size;



const screenTotals = questionCounts.reduce((acc, item) => {
  acc[item.screen] = item._count.id;
  return acc;
}, {} as Record<QuestionScreen, number>);

const TOTAL_LIFESTYLE = screenTotals[QuestionScreen.LIFESTYLE] || 0;

const TOTAL_REALYOU =
  screenTotals[QuestionScreen.REAL_U_MATTERS] || 0;

const TOTAL_THINGS_YOU_LOVE =
  (screenTotals[QuestionScreen.THINGS_U_LOVE] || 0);


const lifestyleScore =
  TOTAL_LIFESTYLE > 0
    ? (lifestyleAnswers / TOTAL_LIFESTYLE) * PROFILE_WEIGHTS.dating.lifestyle
    : 0;

const realYouScore =
  TOTAL_REALYOU > 0
    ? (realYouAnswers / TOTAL_REALYOU) * PROFILE_WEIGHTS.dating.real_you
    : 0;

const thingsYouLoveScore =
  TOTAL_THINGS_YOU_LOVE > 0
    ? (thingsYouLoveAnswers / TOTAL_THINGS_YOU_LOVE) *
      PROFILE_WEIGHTS.dating.things_you_love
    : 0;


  // -------------------------------
  // PHOTOS
  // -------------------------------
  const photoScore =
    (Math.min(photos, 5) / 5) * PROFILE_WEIGHTS.dating.photos;

  // -------------------------------
  // BIO
  // -------------------------------
  const bioText = userBio?.bio || "";

let bioScore = 0;

if (bioText.length >= 80) {
  bioScore = PROFILE_WEIGHTS.dating.bio; // full
} else if (bioText.length >= 30) {
  bioScore = PROFILE_WEIGHTS.dating.bio * 0.7;
} else if (bioText.length > 0) {
  bioScore = PROFILE_WEIGHTS.dating.bio * 0.4;
}


  // -------------------------------
  // FINAL SCORE
  // -------------------------------
  const totalScore =
    basicScore +
    locationScore +
    addressScore +
    interestedScore +
    lifestyleScore +
    realYouScore +
    thingsYouLoveScore +
    photoScore +
    bioScore;

  return Math.round(totalScore);
};
