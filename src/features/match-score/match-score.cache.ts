// import { redis } from "../../lib/redis";

// const getKey = (
//   userId: string,
//   targetUserId: string,
// ) => {
//   return `match-score-${userId}:${targetUserId}`;
// };

// const TTL = 60 * 60 * 24;

// export const matchScoreCache = {
//   async set(
//     userId: string,
//     targetUserId: string,
//     score: number,
//     percentage: number,
//   ) {
//     const key = getKey(
//       userId,
//       targetUserId,
//     );

//     await redis.set(
//       key,
//       JSON.stringify({
//         score,
//         percentage,
//       }),
//       {
//         ex: TTL,
//       },
//     );
//   },

//   async get(
//     userId: string,
//     targetUserId: string,
//   ) {
//     const key = getKey(
//       userId,
//       targetUserId,
//     );

//     const value =
//       await redis.get<string>(key);

//     if (!value) {
//       return null;
//     }

//     return typeof value === "string"
//       ? JSON.parse(value)
//       : value;
//   },

//   async delete(
//     userId: string,
//     targetUserId: string,
//   ) {
//     await redis.del(
//       getKey(
//         userId,
//         targetUserId,
//       ),
//     );
//   },
// };


import { redis } from "../../lib/redis";

const CACHE_TTL = 60 * 60 * 24; // 24 hours
const ALGORITHM_VERSION = "v2";

export type CachedMatchScore = {
  score: number;
  percentage: number;
};

const profileVersionKey = (userId: string) =>
  `match:profile:version:${userId}`;

const scoreKey = (
  userId: string,
  targetId: string,
  userVersion: number,
  targetVersion: number,
) =>
  `match:${ALGORITHM_VERSION}:${userId}:${userVersion}:${targetId}:${targetVersion}`;

const normalizeVersion = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const matchScoreCache = {
  async getVersions(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];

    if (uniqueIds.length === 0) {
      return new Map<string, number>();
    }

    const values = await redis.mget<(number | string | null)[]>(
      ...uniqueIds.map(profileVersionKey),
    );

    return new Map(
      uniqueIds.map((id, index) => [
        id,
        normalizeVersion(values[index]),
      ]),
    );
  },

  async getMany(
    userId: string,
    targetIds: string[],
    versions: Map<string, number>,
  ) {
    const result = new Map<string, CachedMatchScore>();

    if (targetIds.length === 0) {
      return result;
    }

    const keys = targetIds.map((targetId) =>
      scoreKey(
        userId,
        targetId,
        versions.get(userId) ?? 0,
        versions.get(targetId) ?? 0,
      ),
    );

    const values =
      await redis.mget<(CachedMatchScore | null)[]>(
        ...keys,
      );

    targetIds.forEach((id, index) => {
      const value = values[index];

      if (
        value &&
        Number.isFinite(value.score) &&
        Number.isFinite(value.percentage)
      ) {
        result.set(id, value);
      }
    });

    return result;
  },

  async setMany(
    userId: string,
    scores: Map<string, CachedMatchScore>,
    versions: Map<string, number>,
  ) {
    if (scores.size === 0) {
      return;
    }

    const pipeline = redis.pipeline();

    for (const [targetId, value] of scores) {
      pipeline.set(
        scoreKey(
          userId,
          targetId,
          versions.get(userId) ?? 0,
          versions.get(targetId) ?? 0,
        ),
        value,
        { ex: CACHE_TTL },
      );
    }

    await pipeline.exec();
  },

  async invalidateUser(userId: string) {
    await redis.incr(profileVersionKey(userId));
  },
};
