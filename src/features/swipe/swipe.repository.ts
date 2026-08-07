import { Prisma, PrismaClient } from "@prisma/client";
import { redis } from "../../lib/redis";
import { prisma } from "../../prisma/prismaClient";

// Type for transaction client
type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

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

// Transaction-safe version of createSwipe
export const createSwipeTransaction = async (
  tx: TransactionClient,
  data: {
    swiperId: string;
    targetUserId: string;
    action: "LIKE" | "PASS" | "SUPERLIKE";
  }
) => {
  return tx.userSwipe.upsert({
    where: {
      swiperId_targetUserId: {
        swiperId: data.swiperId,
        targetUserId: data.targetUserId,
      },
    },
    update: {
      action: data.action,
    },
    create: {
      swiperId: data.swiperId,
      targetUserId: data.targetUserId,
      action: data.action,
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
      created_at: true,
    },
  });
};

export const checkReverseLike = async (
  swiperId: string,
  targetUserId: string
): Promise<boolean> => {
  const swipe = await prisma.userSwipe.findUnique({
    where: {
      swiperId_targetUserId: {
        swiperId: targetUserId,
        targetUserId: swiperId,
      },
    },
    select: {
      action: true,
    },
  });

  return swipe?.action === "LIKE" || swipe?.action === "SUPERLIKE";
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
  await redis.set(`swipe:${swiperId}:${targetUserId}`, "1", {
    ex: 60 * 60 * 24 * 30, // 30 days
  });
};

export const checkReverseLikeRedis = async (
  swiperId: string,
  targetUserId: string
): Promise<boolean> => {
  const key = `swipe:${targetUserId}:${swiperId}`;
  const value = await redis.get(key);
  return value === "1";
};

export const createMatchAndSwipeTransaction = async (
  swiperId: string,
  targetUserId: string,
  action: "LIKE" | "SUPERLIKE"
) => {
  return prisma.$transaction(async (tx) => {
    // First, check if match already exists (to prevent duplicate match creation)
    const [u1, u2] =
      swiperId < targetUserId 
        ? [swiperId, targetUserId] 
        : [targetUserId, swiperId];

    const existingMatch = await tx.userMatch.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: u1,
          user2Id: u2,
        },
      },
    });

    if (existingMatch) {
      // If match exists, just ensure the swipe is recorded
      await tx.userSwipe.upsert({
        where: {
          swiperId_targetUserId: {
            swiperId,
            targetUserId,
          },
        },
        update: { action },
        create: {
          swiperId,
          targetUserId,
          action,
        },
      });
      
      return existingMatch;
    }

    // Create both swipe and match atomically
    const [swipe, match] = await Promise.all([
      tx.userSwipe.upsert({
        where: {
          swiperId_targetUserId: {
            swiperId,
            targetUserId,
          },
        },
        update: { action },
        create: {
          swiperId,
          targetUserId,
          action,
        },
      }),
      tx.userMatch.create({
        data: {
          user1Id: u1,
          user2Id: u2,
        },
      }),
    ]);

    return match;
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, // Highest isolation level
  });
};
