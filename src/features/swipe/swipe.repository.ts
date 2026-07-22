import { redis } from "../../lib/redis";
import { prisma } from "../../prisma/prismaClient";

export const createSwipe = async (data: {
  swiperId: string;
  targetUserId: string;
  action: "LIKE" | "PASS" | "SUPERLIKE";
}) => {
  return prisma.userSwipe.upsert({
    where: {
      swiperId_targetUserId: {
        swiperId: data.swiperId,
        targetUserId: data.targetUserId,
      },
    },
    update: {
      action: data.action, // ✅ FIXED
    },
    create: {
      swiperId: data.swiperId,
      targetUserId: data.targetUserId,
      action: data.action, // ✅ FIXED
    },
  });
};

export const checkExistingSwipe = async (
  swiperId: string,
  targetUserId: string
) => {
  return prisma.userSwipe.findUnique({
    where: {
      swiperId_targetUserId: {
        swiperId: swiperId,
        targetUserId: targetUserId,
      },
    },
    select: {
      id: true,
      action: true,
      createdAt: true,
    },
  });
};

export const checkReverseLike = async (
  swiperId: string,
  targetUserId: string
) => {
  return prisma.userSwipe.findFirst({
    where: {
      swiperId: targetUserId,
      targetUserId: swiperId,
      action: "LIKE",
    },
    select: { id: true },
  });
};

export const createMatch = async (
  user1Id: string,
  user2Id: string
) => {
  // ensure order consistency
  const [u1, u2] =
    user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  return prisma.userMatch.create({
    data: {
      user1Id: u1,
      user2Id: u2,
    },
  });
};

export const checkMatchExists = async (
  user1Id: string,
  user2Id: string
) => {
  const [u1, u2] =
    user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  return prisma.userMatch.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id: u1,
        user2Id: u2,
      },
    },
  });
};

export const cacheSwipe = async (
  swiperId: string,
  targetUserId: string
) => {
  await redis.sadd(`swipes:${swiperId}`, targetUserId);
};

export const checkReverseLikeRedis = async (
  swiperId: string,
  targetUserId: string
): Promise<boolean> => {
  const exists = await redis.sismember(
    `swipes:${targetUserId}`,
    swiperId
  );

  return exists === 1;
};