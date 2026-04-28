import { redis } from "../../lib/redis";

const ONLINE_KEY = (id: string) => `online:${id}`;
const LAST_ACTIVE_KEY = (id: string) => `lastActive:${id}`;

// ======================
// SET ONLINE
// ======================
export const setUserOnline = async (userId: string) => {
  await redis.set(ONLINE_KEY(userId), "1", { ex: 120 });
  await redis.set(LAST_ACTIVE_KEY(userId), new Date().toISOString());
};

// ======================
// SET OFFLINE
// ======================
export const setUserOffline = async (userId: string) => {
  await redis.del(ONLINE_KEY(userId));
  await redis.set(LAST_ACTIVE_KEY(userId), new Date().toISOString());
};

// ======================
// HEARTBEAT
// ======================
export const updateHeartbeat = async (userId: string) => {
  await redis.set(ONLINE_KEY(userId), "1", { ex: 120 });
  await redis.set(LAST_ACTIVE_KEY(userId), new Date().toISOString());
};

// ======================
// BATCH PRESENCE
// ======================
export const getUsersPresence = async (userIds: string[]) => {
  const onlineKeys = userIds.map(id => ONLINE_KEY(id));
  const lastActiveKeys = userIds.map(id => LAST_ACTIVE_KEY(id));

  const [onlineResults, lastActiveResults] = await Promise.all([
    redis.mget(...onlineKeys),
    redis.mget(...lastActiveKeys),
  ]);

  const map: Record<string, any> = {};

  userIds.forEach((id, index) => {
    map[id] = {
      isOnline: !!onlineResults[index],
      lastActiveAt: lastActiveResults[index]
        ? new Date(lastActiveResults[index] as string)
        : null,
    };
  });

  return map;
};


