
import { redis } from "../../../lib/redis";
import { prisma } from "../../../prisma/prismaClient";
import { RewardConfigPayload } from "./referEarn.types";

const CACHE_KEY = "rewardConfig";

// Clear Reward Config Cache
const clearRewardConfigCache = async () => {
  await redis.del(CACHE_KEY);
  console.log("🗑️ Reward Config cache cleared");
};

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

  let rewardConfig;

  if (existing) {
    rewardConfig = await prisma.rewardConfig.update({
      where: {
        id: existing.id,
      },
      data,
    });
  } else {
    rewardConfig = await prisma.rewardConfig.create({
      data,
    });
  }

  // Clear cache after successful DB operation
  await clearRewardConfigCache();

  return rewardConfig;
};

/**
 * Get Reward Config
 */
export const getRewardConfig = async () => {
  const cached = await redis.get(CACHE_KEY);
  if (cached) {
    console.log("✅ Cache Hit: rewardConfig");
    return cached;
  }
  console.log("📦 Cache Miss: rewardConfig");

  // Fetch from Database
  const rewardConfig = await prisma.rewardConfig.findFirst();
  // Store in Redis (only if data exists)
  if (rewardConfig) {
    await redis.set(CACHE_KEY, rewardConfig, {
      ex: 600, // 10 minutes
    });
  }
  return rewardConfig;
};