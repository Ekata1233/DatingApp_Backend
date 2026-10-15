import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { createNotification } from "../notification/notification.service";
import {
  cacheSwipe,
  checkReverseLike,
  checkReverseLikeRedis,
} from "./swipe.repository";
import { trackBoostEvent } from "../boost/boost.tracker";
import { recordDailyFeedView } from "./swipe.helper";

// export const handleSwipe = async (data: {
//   swiperId: string;
//   targetUserId: string;
//   action: "LIKE" | "PASS" | "SUPERLIKE";
// }) => {
//   const { swiperId, targetUserId, action } = data;

//   // Prevent self swipe
//   if (swiperId === targetUserId) {
//     throw new Error("Cannot swipe yourself");
//   }

//   // ------------------------------------------------------------
//   // PASS: save swipe only (no match possible)
//   // ------------------------------------------------------------
//   if (action === "PASS") {
//     await prisma.$transaction(
//       async (tx) => {
//         // Duplicate swipe check inside transaction
//         const existing = await tx.userSwipe.findUnique({
//           where: {
//             swiperId_targetUserId: {
//               swiperId,
//               targetUserId,
//             },
//           },
//         });

//         if (existing) {
//           throw new Error("Already swiped on this user");
//         }

//         await tx.userSwipe.create({
//           data: {
//             swiperId,
//             targetUserId,
//             action,
//           },
//         });

//         // Record daily feed view
//         await recordDailyFeedView(tx, swiperId, targetUserId);
//       },
//       {
//         isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
//       },
//     );

//     // Cache (do not fail request if Redis is down)
//     cacheSwipe(swiperId, targetUserId).catch(console.error);
//     // ==========================================
//     // BOOST ANALYTICS - PASS
//     // ==========================================
//     trackBoostEvent({
//       targetUserId,
//       actorId: swiperId,
//       type: "PASS",
//     }).catch(console.error);

//     return { matched: false };
//   }

//   // ------------------------------------------------------------
//   // Check reverse like (Redis -> DB fallback)
//   // ------------------------------------------------------------
//   let reverse = false;

//   try {
//     reverse = await checkReverseLikeRedis(swiperId, targetUserId);
//   } catch (err) {
//     console.error("Redis reverse check failed:", err);
//   }

//   if (!reverse) {
//     const dbReverse = await checkReverseLike(swiperId, targetUserId);

//     if (dbReverse) {
//       reverse = true;

//       // Warm Redis cache
//       cacheSwipe(targetUserId, swiperId).catch(console.error);
//     }
//   }

//   // ------------------------------------------------------------
//   // No reverse like: save swipe only
//   // ------------------------------------------------------------
//   if (!reverse) {
//     console.log("in swipe transaction : ");
//     await prisma.$transaction(
//       async (tx) => {
//         // Duplicate swipe check inside transaction
//         const existing = await tx.userSwipe.findUnique({
//           where: {
//             swiperId_targetUserId: {
//               swiperId,
//               targetUserId,
//             },
//           },
//         });

//         if (existing) {
//           throw new Error("Already swiped on this user");
//         }

//         await tx.userSwipe.create({
//           data: {
//             swiperId,
//             targetUserId,
//             action,
//           },
//         });

//         // NEW: Record daily feed view
//         await recordDailyFeedView(tx, swiperId, targetUserId);
//       },
//       {
//         isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
//       },
//     );
//     console.log("after swipe transaction : ");

//     cacheSwipe(swiperId, targetUserId).catch(console.error);
//     console.log("after cacge transaction : ");
//     console.log("before notification swipe transaction : ");

//     // ==========================================
//     // BOOST ANALYTICS
//     // ==========================================

//     trackBoostEvent({
//       targetUserId,
//       actorId: swiperId,
//       type: action === "SUPERLIKE" ? "SUPERLIKE" : "LIKE",
//     }).catch(console.error);

//     // Fire-and-forget notification
//     createNotification({
//       senderId: swiperId,
//       receiverId: targetUserId,
//       type:
//         action === "SUPERLIKE"
//           ? NotificationType.SUPER_LIKE
//           : NotificationType.NEW_LIKE,
//       title: action === "SUPERLIKE" ? "New Super Like ⭐" : "New Like ❤️",
//       message:
//         action === "SUPERLIKE"
//           ? "Someone super liked your profile ⭐"
//           : "Someone liked your profile ❤️",
//       data: {
//         userId: swiperId,
//         targetUserId,
//         action,
//       },
//     }).catch(console.error);
//     console.log("after notification transaction : ");

//     return { matched: false };
//   }

//   // ------------------------------------------------------------
//   // Reverse like exists → create swipe + match atomically
//   // ------------------------------------------------------------
//   let match;

//   try {
//     match = await prisma.$transaction(
//       async (tx) => {
//         // Duplicate swipe check
//         const existingSwipe = await tx.userSwipe.findUnique({
//           where: {
//             swiperId_targetUserId: {
//               swiperId,
//               targetUserId,
//             },
//           },
//         });

//         if (existingSwipe) {
//           throw new Error("Already swiped on this user");
//         }

//         // Create current swipe
//         await tx.userSwipe.create({
//           data: {
//             swiperId,
//             targetUserId,
//             action,
//           },
//         });

//         await recordDailyFeedView(tx, swiperId, targetUserId);

//         // Check if match already exists
//         const existingMatch = await tx.userMatch.findFirst({
//           where: {
//             OR: [
//               { user1Id: swiperId, user2Id: targetUserId },
//               { user1Id: targetUserId, user2Id: swiperId },
//             ],
//           },
//         });

//         if (existingMatch) {
//           return existingMatch;
//         }

//         // Create match
//         return await tx.userMatch.create({
//           data: {
//             user1Id: swiperId,
//             user2Id: targetUserId,
//           },
//         });
//       },
//       {
//         isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
//       },
//     );
//   } catch (error) {
//     // Handle unique constraint race gracefully
//     if (
//       error instanceof Prisma.PrismaClientKnownRequestError &&
//       error.code === "P2002"
//     ) {
//       const existingMatch = await prisma.userMatch.findFirst({
//         where: {
//           OR: [
//             { user1Id: swiperId, user2Id: targetUserId },
//             { user1Id: targetUserId, user2Id: swiperId },
//           ],
//         },
//       });

//       if (existingMatch) {
//         cacheSwipe(swiperId, targetUserId).catch(console.error);

//         return {
//           matched: true,
//           matchId: existingMatch.id,
//         };
//       }
//     }

//     throw error;
//   }

//   // ------------------------------------------------------------
//   // Cache after successful commit
//   // ------------------------------------------------------------
//   cacheSwipe(swiperId, targetUserId).catch(console.error);
//   console.log("------------------", {
//     swiperId,
//     targetUserId,
//     action,
//   });

//   // ============================================================
//   // BOOST ANALYTICS - MATCH
//   // Check both users because either user can have active boost
//   // ============================================================

//   Promise.all([
//     trackBoostEvent({
//       targetUserId,
//       actorId: swiperId,
//       type: "MATCH",
//     }),

//     trackBoostEvent({
//       targetUserId: swiperId,
//       actorId: targetUserId,
//       type: "MATCH",
//     }),
//   ]).catch(console.error);

//   // ------------------------------------------------------------
//   // Fire-and-forget match notifications
//   // ------------------------------------------------------------
//   Promise.all([
//     createNotification({
//       senderId: swiperId,
//       receiverId: targetUserId,
//       type: NotificationType.NEW_MATCH,
//       title: "It's a Match! 🎉",
//       message: "You both liked each other ❤️",
//       data: {
//         matchId: match.id,
//         userId: swiperId,
//         type: "MATCH",
//       },
//     }),

//     createNotification({
//       senderId: targetUserId,
//       receiverId: swiperId,
//       type: NotificationType.NEW_MATCH,
//       title: "It's a Match! 🎉",
//       message: "You both liked each other ❤️",
//       data: {
//         matchId: match.id,
//         userId: targetUserId,
//         type: "MATCH",
//       },
//     }),
//   ]).catch(console.error);

//   // ------------------------------------------------------------
//   // Get both users' primary profile photos for match popup
//   // ------------------------------------------------------------
//   const [swiperPhoto, targetPhoto] = await Promise.all([
//     prisma.userPhoto.findFirst({
//       where: {
//         user_id: swiperId,
//         is_primary: true,
//         media_type: "IMAGE",
//       },
//       select: {
//         media_url: true,
//       },
//     }),

//     prisma.userPhoto.findFirst({
//       where: {
//         user_id: targetUserId,
//         is_primary: true,
//         media_type: "IMAGE",
//       },
//       select: {
//         media_url: true,
//       },
//     }),
//   ]);

//   return {
//     matched: true,
//     matchId: match.id,

//     matchPopup: {
//       title: "It's a Match! ❤️",

//       message:
//         "Two hearts beating to the same rhythm. Your connection is already written in the stars. ✨",

//       users: {
//         me: {
//           userId: swiperId,
//           profilePhoto: swiperPhoto?.media_url ?? null,
//         },

//         matchedUser: {
//           userId: targetUserId,
//           profilePhoto: targetPhoto?.media_url ?? null,
//         },
//       },
//     },
//   };
// };

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
        return {
          matched: true,
          updated: swipeResult.updated,
          previousAction: swipeResult.previousAction,
          match: existingMatch,
        };
      }

      const match = await tx.userMatch.create({
        data: {
          user1Id: swiperId,
          user2Id: targetUserId,
        },
      });

      return {
        matched: true,
        updated: swipeResult.updated,
        previousAction: swipeResult.previousAction,
        match,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );

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
          ? "Someone super liked your profile ⭐"
          : "Someone liked your profile ❤️",
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
