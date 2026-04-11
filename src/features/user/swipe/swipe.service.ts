// modules/swipe/swipe.service.ts

import { prisma } from "../../../prisma/prismaClient";


interface SwipeParams {
  userId: string;
  targetUserId: string;
  action: "LIKE" | "PASS" | "SUPERLIKE";
}

export const swipeService = async ({
  userId,
  targetUserId,
  action,
}: SwipeParams) => {
  if (userId === targetUserId) {
    throw new Error("You cannot swipe yourself");
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Check if already swiped (idempotent)
    const existingSwipe = await tx.userSwipe.findUnique({
      where: {
        swiperId_targetUserId: {
          swiperId: userId,
          targetUserId,
        },
      },
    });

    if (existingSwipe) {
      return {
        message: "Already swiped",
        isMatch: existingSwipe.isMutual,
      };
    }

    // 2. Check reverse swipe (for MATCH)
    const reverseSwipe = await tx.userSwipe.findUnique({
      where: {
        swiperId_targetUserId: {
          swiperId: targetUserId,
          targetUserId: userId,
        },
      },
    });

    let isMatch = false;

    if (
      reverseSwipe &&
      reverseSwipe.action === "LIKE" &&
      action === "LIKE"
    ) {
      isMatch = true;
    }

    // 3. Create swipe
    const newSwipe = await tx.userSwipe.create({
      data: {
        swiperId: userId,
        targetUserId,
        action,
        isMutual: isMatch,
      },
    });

    // 4. If match → update reverse swipe + create match
    if (isMatch) {
      await tx.userSwipe.update({
        where: {
          swiperId_targetUserId: {
            swiperId: targetUserId,
            targetUserId: userId,
          },
        },
        data: {
          isMutual: true,
        },
      });

      // OPTIONAL (recommended) → Match table
      await tx.match.create({
        data: {
          user1Id: userId,
          user2Id: targetUserId,
        },
      });
    }

    return {
      message: isMatch ? "It's a match!" : "Swipe recorded",
      isMatch,
      swipe: newSwipe,
    };
  });
};
