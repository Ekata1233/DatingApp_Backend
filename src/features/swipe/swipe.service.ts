import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { createNotification } from "../notification/notification.service";
import {
  cacheSwipe,
  checkReverseLike,
  checkReverseLikeRedis,
} from "./swipe.repository";
import { trackBoostEvent } from "../boost/boost.tracker";
import {
  findOrCreateMatchConversation,
  recordDailyFeedView,
} from "./swipe.helper";

const saveOrUpdateSwipe = async (
  tx: Prisma.TransactionClient,
  swiperId: string,
  targetUserId: string,
  action: "LIKE" | "PASS" | "SUPERLIKE",
) => {
  const existing = await tx.userSwipe.findUnique({
    where: {
      swiperId_targetUserId: {
        swiperId,
        targetUserId,
      },
    },
  });

  if (existing) {
    // Same action -> return success without updating DB
    if (existing.action === action) {
      return {
        updated: false,
        alreadyExists: true,
        previousAction: existing.action,
      };
    }

    // Different action -> update existing swipe
    await tx.userSwipe.update({
      where: {
        swiperId_targetUserId: {
          swiperId,
          targetUserId,
        },
      },
      data: {
        action,
      },
    });

    return {
      updated: true,
      alreadyExists: false,
      previousAction: existing.action,
    };
  }

  // First swipe -> create new record
  await tx.userSwipe.create({
    data: {
      swiperId,
      targetUserId,
      action,
    },
  });

  return {
    updated: false,
    alreadyExists: false,
    previousAction: null,
  };
};

export const handleSwipe = async (data: {
  swiperId: string;
  targetUserId: string;
  action: "LIKE" | "PASS" | "SUPERLIKE";
}) => {
  const { swiperId, targetUserId, action } = data;

  if (swiperId === targetUserId) {
    throw new Error("Cannot swipe yourself");
  }

  // ============================================================
  // 1. SAVE OR UPDATE SWIPE + CHECK MATCH ATOMICALLY
  // ============================================================

  const result = await prisma.$transaction(
    async (tx) => {
      const swipeResult = await saveOrUpdateSwipe(
        tx,
        swiperId,
        targetUserId,
        action,
      );

      await recordDailyFeedView(tx, swiperId, targetUserId);

      // --------------------------------------------------------
      // PASS: remove existing match if present
      // --------------------------------------------------------

      if (action === "PASS") {
        const existingMatch = await tx.userMatch.findFirst({
          where: {
            OR: [
              {
                user1Id: swiperId,
                user2Id: targetUserId,
              },
              {
                user1Id: targetUserId,
                user2Id: swiperId,
              },
            ],
          },
        });

        if (existingMatch) {
          await tx.userMatch.delete({
            where: {
              id: existingMatch.id,
            },
          });
        }

        return {
          matched: false,
          updated: swipeResult.updated,
          previousAction: swipeResult.previousAction,
          match: null,
        };
      }

      // --------------------------------------------------------
      // Check reverse LIKE / SUPERLIKE from DB
      // --------------------------------------------------------

      const reverseSwipe = await tx.userSwipe.findUnique({
        where: {
          swiperId_targetUserId: {
            swiperId: targetUserId,
            targetUserId: swiperId,
          },
        },
      });

      const reverse =
        reverseSwipe?.action === "LIKE" || reverseSwipe?.action === "SUPERLIKE";

      if (!reverse) {
        return {
          matched: false,
          updated: swipeResult.updated,
          previousAction: swipeResult.previousAction,
          match: null,
        };
      }

      // --------------------------------------------------------
      // Reverse like exists -> find or create match
      // --------------------------------------------------------

      const existingMatch = await tx.userMatch.findFirst({
        where: {
          OR: [
            {
              user1Id: swiperId,
              user2Id: targetUserId,
            },
            {
              user1Id: targetUserId,
              user2Id: swiperId,
            },
          ],
        },
      });

      if (existingMatch) {
        const conversationId = await findOrCreateMatchConversation(
          tx,
          swiperId,
          targetUserId,
        );
        return {
          matched: true,
          isNewMatch: false,
          updated: swipeResult.updated,
          previousAction: swipeResult.previousAction,
          match: existingMatch,
          conversationId,
        };
      }

      const match = await tx.userMatch.create({
        data: {
          user1Id: swiperId,
          user2Id: targetUserId,
        },
      });

      // Create conversation when match occurs
      const conversationId = await findOrCreateMatchConversation(
        tx,
        swiperId,
        targetUserId,
      );

      return {
        matched: true,
        updated: swipeResult.updated,
        isNewMatch: true,
        previousAction: swipeResult.previousAction,
        match,
        conversationId,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

  // ============================================================
  // GET SWIPER AND TARGET USER NAMES
  // ============================================================

  const [swiper, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: swiperId,
      },
      select: {
        full_name: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        full_name: true,
      },
    }),
  ]);

  const swiperName = swiper?.full_name?.trim() || "Someone";

  const targetUserName = targetUser?.full_name?.trim() || "Someone";

  // ============================================================
  // 2. UPDATE REDIS CACHE
  // ============================================================

  // IMPORTANT:
  // Your existing cacheSwipe() must support changed actions.
  // In particular, PASS must invalidate any old LIKE cache.

  if (action === "PASS") {
    // Replace with your actual Redis invalidation helper.
    // Do not call cacheSwipe() if it caches all swipes as likes.
  } else {
    cacheSwipe(swiperId, targetUserId).catch(console.error);
  }

  // ============================================================
  // 3. PASS ANALYTICS
  // ============================================================

  if (action === "PASS") {
    trackBoostEvent({
      targetUserId,
      actorId: swiperId,
      type: "PASS",
    }).catch(console.error);

    return {
      matched: false,
      updated: result.updated,
      previousAction: result.previousAction,
      action,
    };
  }

  // ============================================================
  // 4. NO MATCH
  // ============================================================

  if (!result.matched || !result.match) {
    trackBoostEvent({
      targetUserId,
      actorId: swiperId,
      type: action === "SUPERLIKE" ? "SUPERLIKE" : "LIKE",
    }).catch(console.error);

    createNotification({
      senderId: swiperId,
      receiverId: targetUserId,
      type:
        action === "SUPERLIKE"
          ? NotificationType.SUPER_LIKE
          : NotificationType.NEW_LIKE,
      title: action === "SUPERLIKE" ? "New Super Like ⭐" : "New Like ❤️",
      message:
        action === "SUPERLIKE"
          ? `${swiperName} super liked your profile ⭐`
          : `${swiperName} liked your profile ❤️`,
      data: {
        userId: swiperId,
        targetUserId,
        action,
      },
    }).catch(console.error);

    return {
      matched: false,
      updated: result.updated,
      previousAction: result.previousAction,
      action,
    };
  }

  // ============================================================
  // 5. MATCH CREATED / FOUND
  // ============================================================

  const match = result.match;

  Promise.all([
    trackBoostEvent({
      targetUserId,
      actorId: swiperId,
      type: "MATCH",
    }),

    trackBoostEvent({
      targetUserId: swiperId,
      actorId: targetUserId,
      type: "MATCH",
    }),
  ]).catch(console.error);

  // ============================================================
  // 6. MATCH NOTIFICATIONS
  // ============================================================

  // SEND MATCH NOTIFICATION ONLY ONCE
  if (result.isNewMatch === true) {
    await Promise.all([
      // Notification to User A
      createNotification({
        senderId: swiperId,
        receiverId: targetUserId,
        type: NotificationType.NEW_MATCH,
        title: "It's a Match! 🎉",
        message: `You and ${swiperName} matched! ❤️`,
        data: {
          matchId: match.id,
          conversationId: result.conversationId,
          userId: swiperId,
          type: "MATCH",
        },
      }),

      // Notification to User B
      createNotification({
        senderId: targetUserId,
        receiverId: swiperId,
        type: NotificationType.NEW_MATCH,
        title: "It's a Match! 🎉",
        message: `You and ${targetUserName} matched! ❤️`,
        data: {
          matchId: match.id,
          conversationId: result.conversationId,
          userId: targetUserId,
          type: "MATCH",
        },
      }),
    ]);
  }
  // ============================================================
  // 7. GET PRIMARY PROFILE PHOTOS
  // ============================================================

  const [swiperPhoto, targetPhoto] = await Promise.all([
    prisma.userPhoto.findFirst({
      where: {
        user_id: swiperId,
        is_primary: true,
        media_type: "IMAGE",
      },
      select: {
        media_url: true,
      },
    }),

    prisma.userPhoto.findFirst({
      where: {
        user_id: targetUserId,
        is_primary: true,
        media_type: "IMAGE",
      },
      select: {
        media_url: true,
      },
    }),
  ]);

  // ============================================================
  // 8. MATCH POPUP RESPONSE
  // ============================================================

  return {
    matched: true,
    matchId: match.id,
    conversationId: result.conversationId,
    updated: result.updated,
    previousAction: result.previousAction,
    action,

    matchPopup: {
      title: "It's a Match! ❤️",
      message:
        "Two hearts beating to the same rhythm. Your connection is already written in the stars. ✨",
      users: {
        me: {
          userId: swiperId,
          profilePhoto: swiperPhoto?.media_url ?? null,
        },

        matchedUser: {
          userId: targetUserId,
          profilePhoto: targetPhoto?.media_url ?? null,
        },
      },
    },
  };
};
