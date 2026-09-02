
import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { createNotification } from "../notification/notification.service";
import {
  cacheSwipe,
  checkReverseLike,
  checkReverseLikeRedis,
} from "./swipe.repository";

export const handleSwipe = async (data: {
  swiperId: string;
  targetUserId: string;
  action: "LIKE" | "PASS" | "SUPERLIKE";
}) => {
  const { swiperId, targetUserId, action } = data;

  // Prevent self swipe
  if (swiperId === targetUserId) {
    throw new Error("Cannot swipe yourself");
  }

  // ------------------------------------------------------------
  // PASS: save swipe only (no match possible)
  // ------------------------------------------------------------
  if (action === "PASS") {
    await prisma.$transaction(
      async (tx) => {
        // Duplicate swipe check inside transaction
        const existing = await tx.userSwipe.findUnique({
          where: {
            swiperId_targetUserId: {
              swiperId,
              targetUserId,
            },
          },
        });

        if (existing) {
          throw new Error("Already swiped on this user");
        }

        await tx.userSwipe.create({
          data: {
            swiperId,
            targetUserId,
            action,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    // Cache (do not fail request if Redis is down)
    cacheSwipe(swiperId, targetUserId).catch(console.error);

    return { matched: false };
  }

  // ------------------------------------------------------------
  // Check reverse like (Redis -> DB fallback)
  // ------------------------------------------------------------
  let reverse = false;

  try {
    reverse = await checkReverseLikeRedis(swiperId, targetUserId);
  } catch (err) {
    console.error("Redis reverse check failed:", err);
  }

  if (!reverse) {
    const dbReverse = await checkReverseLike(swiperId, targetUserId);

    if (dbReverse) {
      reverse = true;

      // Warm Redis cache
      cacheSwipe(targetUserId, swiperId).catch(console.error);
    }
  }

  // ------------------------------------------------------------
  // No reverse like: save swipe only
  // ------------------------------------------------------------
  if (!reverse) {
    await prisma.$transaction(
      async (tx) => {
        // Duplicate swipe check inside transaction
        const existing = await tx.userSwipe.findUnique({
          where: {
            swiperId_targetUserId: {
              swiperId,
              targetUserId,
            },
          },
        });

        if (existing) {
          throw new Error("Already swiped on this user");
        }

        await tx.userSwipe.create({
          data: {
            swiperId,
            targetUserId,
            action,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );

    cacheSwipe(swiperId, targetUserId).catch(console.error);

    // Fire-and-forget notification
    createNotification({
      senderId: swiperId,
      receiverId: targetUserId,
      type:
        action === "SUPERLIKE"
          ? NotificationType.SUPER_LIKE
          : NotificationType.NEW_LIKE, title:
        action === "SUPERLIKE"
          ? "New Super Like ⭐"
          : "New Like ❤️",
      message:
        action === "SUPERLIKE"
          ? "Someone super liked your profile ⭐"
          : "Someone liked your profile ❤️",
      data: {
        userId: swiperId,
        targetUserId,
        action,
      },
    }).catch(console.error);

    return { matched: false };
  }

  // ------------------------------------------------------------
  // Reverse like exists → create swipe + match atomically
  // ------------------------------------------------------------
  let match;

  try {
    match = await prisma.$transaction(
      async (tx) => {
        // Duplicate swipe check
        const existingSwipe = await tx.userSwipe.findUnique({
          where: {
            swiperId_targetUserId: {
              swiperId,
              targetUserId,
            },
          },
        });

        if (existingSwipe) {
          throw new Error("Already swiped on this user");
        }

        // Create current swipe
        await tx.userSwipe.create({
          data: {
            swiperId,
            targetUserId,
            action,
          },
        });

        // Check if match already exists
        const existingMatch = await tx.userMatch.findFirst({
          where: {
            OR: [
              { user1Id: swiperId, user2Id: targetUserId },
              { user1Id: targetUserId, user2Id: swiperId },
            ],
          },
        });

        if (existingMatch) {
          return existingMatch;
        }

        // Create match
        return await tx.userMatch.create({
          data: {
            user1Id: swiperId,
            user2Id: targetUserId,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      }
    );
  } catch (error) {
    // Handle unique constraint race gracefully
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existingMatch = await prisma.userMatch.findFirst({
        where: {
          OR: [
            { user1Id: swiperId, user2Id: targetUserId },
            { user1Id: targetUserId, user2Id: swiperId },
          ],
        },
      });

      if (existingMatch) {
        cacheSwipe(swiperId, targetUserId).catch(console.error);

        return {
          matched: true,
          matchId: existingMatch.id,
        };
      }
    }

    throw error;
  }

  // ------------------------------------------------------------
  // Cache after successful commit
  // ------------------------------------------------------------
  cacheSwipe(swiperId, targetUserId).catch(console.error);
  console.log("------------------", {
    swiperId,
    targetUserId,
    action,
  });
  // ------------------------------------------------------------
  // Fire-and-forget match notifications
  // ------------------------------------------------------------
  Promise.all([
    createNotification({
      senderId: swiperId,
      receiverId: targetUserId,
      type: NotificationType.NEW_MATCH,
      title: "It's a Match! 🎉",
      message: "You both liked each other ❤️",
      data: {
        matchId: match.id,
        userId: swiperId,
        type: "MATCH",
      },
    }),

    createNotification({
      senderId: targetUserId,
      receiverId: swiperId,
      type: NotificationType.NEW_MATCH,
      title: "It's a Match! 🎉",
      message: "You both liked each other ❤️",
      data: {
        matchId: match.id,
        userId: targetUserId,
        type: "MATCH",
      },
    }),
  ]).catch(console.error);

  return {
    matched: true,
    matchId: match.id,
  };
};