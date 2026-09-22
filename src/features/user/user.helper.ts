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

export const clearUserFeedDetailsCache = async (userId: string) => {
  const pattern = `feed:details:${userId}:*`;

  console.log("🧹 Clearing user feed details cache:", pattern);

  let cursor = "0";
  let totalDeleted = 0;

  do {
    const result = await redis.scan(cursor, {
      match: pattern,
      count: 100,
    });

    cursor = result[0];
    const keys = result[1];

    console.log("🔍 Matching feed detail keys:", keys);

    if (keys.length > 0) {
      const deleted = await redis.del(...keys);

      console.log("🗑️ Deleted feed detail keys:", deleted);

      totalDeleted += deleted;
    }
  } while (cursor !== "0");

  console.log(
    `✅ Total feed detail cache deleted for ${userId}:`,
    totalDeleted
  );

  return totalDeleted;
};