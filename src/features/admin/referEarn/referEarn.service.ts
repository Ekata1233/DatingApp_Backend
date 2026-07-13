
import { prisma } from "../../../prisma/prismaClient";
import { RewardConfigPayload } from "./referEarn.types";

export const createOrUpdateRewardConfig = async (
  payload: RewardConfigPayload
) => {
  const existing = await prisma.rewardConfig.findFirst();

  const data = {
    signupReward: payload.signupReward,
    packageReward: payload.packageReward,
    waitlistReward: payload.waitlistReward,
    title: payload.title,
    descriptions: payload.descriptions,
  };

  if (existing) {
    return await prisma.rewardConfig.update({
      where: {
        id: existing.id,
      },
      data,
    });
  }

  return await prisma.rewardConfig.create({
    data,
  });
};

export const getRewardConfig = async () => {
  return await prisma.rewardConfig.findFirst();
};