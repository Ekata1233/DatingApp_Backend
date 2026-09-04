import { redis } from "../../lib/redis";

export const clearFeedUserCache = async (
  userId: string,
) => {
  try {
    await redis.del(
      `feed:user:${userId}`,
    );

    console.log(
      `Feed user cache cleared: ${userId}`,
    );
  } catch (error) {
    console.error(
      "Failed to clear feed user cache:",
      error,
    );
  }
};