import { redis } from "../../lib/redis";

const getKey = (
  userId: string,
  targetUserId: string,
) => {
  return `match-score-${userId}:${targetUserId}`;
};

const TTL = 60 * 60 * 24;

export const matchScoreCache = {
  async set(
    userId: string,
    targetUserId: string,
    score: number,
    percentage: number,
  ) {
    const key = getKey(
      userId,
      targetUserId,
    );

    await redis.set(
      key,
      JSON.stringify({
        score,
        percentage,
      }),
      {
        ex: TTL,
      },
    );
  },

  async get(
    userId: string,
    targetUserId: string,
  ) {
    const key = getKey(
      userId,
      targetUserId,
    );

    const value =
      await redis.get<string>(key);

    if (!value) {
      return null;
    }

    return typeof value === "string"
      ? JSON.parse(value)
      : value;
  },

  async delete(
    userId: string,
    targetUserId: string,
  ) {
    await redis.del(
      getKey(
        userId,
        targetUserId,
      ),
    );
  },
};