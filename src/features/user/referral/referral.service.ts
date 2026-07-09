
import { prisma } from "../../../prisma/prismaClient";
import { ValidateReferralResponse } from "./referral.types";

export const validateReferralCode = async (
  userId: string,
  referralCode: string
): Promise<ValidateReferralResponse> => {

  referralCode = referralCode.trim().toUpperCase();

  // Find current user
  const currentUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      referralCode: true,
    },
  });

  if (!currentUser) {
    return {
      success: false,
      message: "User not found",
    };
  }

  // Self referral
  if (currentUser.referralCode === referralCode) {
    return {
      success: false,
      message: "You cannot use your own referral code.",
    };
  }

  // Already used a referral?
  const alreadyUsed = await prisma.userReferral.findUnique({
    where: {
      referredUserId: userId,
    },
  });

  if (alreadyUsed) {
    return {
      success: false,
      message: "Referral code has already been used.",
    };
  }

  // Find referrer
  const referrer = await prisma.user.findFirst({
    where: {
      referralCode,
      deleted_at: null,
    },
    select: {
      id: true,
      full_name: true,
      referralCode: true,
    },
  });

  if (!referrer) {
    return {
      success: false,
      message: "Invalid referral code.",
    };
  }

  // Extra safety
  if (referrer.id === userId) {
    return {
      success: false,
      message: "You cannot use your own referral code.",
    };
  }

  return {
    success: true,
    message: "Referral code applied successfully.",
    referrerName: referrer.full_name ?? "Welvors User",
  };
};