
import { prisma } from "../../../prisma/prismaClient";
import { ValidateReferralResponse } from "./referral.types";

export const validateReferralCode = async (
  referralCode: string
): Promise<ValidateReferralResponse> => {

  const user = await prisma.user.findUnique({
    where: {
      referralCode: referralCode.toUpperCase(),
    },
    select: {
      id: true,
      full_name: true,
    },
  });

  if (!user) {
    return {
      success: false,
      message: "Invalid referral code",
    };
  }

  return {
    success: true,
    message: "Referral code applied successfully",
    referrerName: user.full_name ?? "Welvors User",
  };
};