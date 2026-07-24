

// import { prisma } from "../../prisma/prismaClient";
// import { createNotification } from "../notification/notification.service";
// import {
//   createSwipe,
//   checkReverseLike,
//   createMatch,
//   checkMatchExists,
//   cacheSwipe,
//   checkReverseLikeRedis,
//   checkExistingSwipe,
//   createSwipeTransaction,
//   createMatchAndSwipeTransaction,
// } from "./swipe.repository";

// export const handleSwipe = async (data: {
//   swiperId: string;
//   targetUserId: string;
//   action: "LIKE" | "PASS" | "SUPERLIKE";
// }) => {
//   const { swiperId, targetUserId, action } = data;

//   if (swiperId === targetUserId) {
//     throw new Error("Cannot swipe yourself");
//   }

//     // 1. Check for duplicate swipe (idempotency)
//   const existingSwipe = await checkExistingSwipe(swiperId, targetUserId);
//   if (existingSwipe) {
//     throw new Error("Already swiped on this user");
//   }

//   // Only LIKE / SUPERLIKE can create match
//   if (action === "PASS") {
//     // Save PASS swipe (no match possible)
//     // await createSwipe({ swiperId, targetUserId, action });
//     // await cacheSwipe(swiperId, targetUserId);
//     // return { matched: false };
//      // Save PASS swipe (no match possible) - use transaction for consistency
//     await prisma.$transaction(async (tx) => {
//       await createSwipeTransaction(tx, { swiperId, targetUserId, action });
//     });

//     await cacheSwipe(swiperId, targetUserId);
//     return { matched: false };
//   }

//     let reverse = await checkReverseLikeRedis(swiperId, targetUserId);

//   if (!reverse) {
//     const dbReverse = await checkReverseLike(swiperId, targetUserId);
//     if (dbReverse) {
//       // Cache the reverse like for future lookups
//       await cacheSwipe(targetUserId, swiperId);
//       reverse = true;
//     }
//   }

//   // 4. If no reverse like, just send LIKE notification and return
//   if (!reverse) {
//      // Use transaction for swipe creation
//     await prisma.$transaction(async (tx) => {
//       await createSwipeTransaction(tx, { swiperId, targetUserId, action });
//     });

//     await cacheSwipe(swiperId, targetUserId);

//     await createNotification({
//       sender_id: swiperId,
//       receiver_id: targetUserId,
//       type: "LIKE",
//       message:
//         action === "SUPERLIKE"
//           ? "Someone super liked your profile ⭐"
//           : "Someone liked your profile ❤️",
//     });
//     return { matched: false };
//   }

//   // 5. Create match and swipe in a single transaction to prevent race conditions
//   let match;
//   try {
//     match = await createMatchAndSwipeTransaction(
//       swiperId, 
//       targetUserId, 
//       action
//     );
//   } catch (error) {
//     // Handle duplicate match creation gracefully
//     if ((error as any).code === 'P2002') { // Prisma unique constraint violation
//       const existingMatch = await checkMatchExists(swiperId, targetUserId);
//       if (existingMatch) {
//         // Ensure swipe is cached even if match already exists
//         await cacheSwipe(swiperId, targetUserId);
//         // return { matched: true, matchId: existingMatch.id };
//       }
//     }
//     throw error; // Re-throw if it's not a duplicate match issue
//   }

//   // Cache the swipe after successful transaction
//   await cacheSwipe(swiperId, targetUserId);

//   // 7. Send notifications in parallel
//   await Promise.all([
//     createNotification({
//       sender_id: swiperId,
//       receiver_id: targetUserId,
//       type: "MATCH",
//       message: "It's a match 🎉",
//     }),
//     createNotification({
//       sender_id: targetUserId,
//       receiver_id: swiperId,
//       type: "MATCH",
//       message: "It's a match 🎉",
//     }),
//   ]);

//   return {
//     matched: true,
//     matchId: match.id,
//   };
// };

import { Prisma } from "@prisma/client";
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
  

  console.log("---------------", {
    swiperId,
    targetUserId,
    action,
  });
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
      sender_id: swiperId,
      receiver_id: targetUserId,
      type: "LIKE",
      message:
        action === "SUPERLIKE"
          ? "Someone super liked your profile ⭐"
          : "Someone liked your profile ❤️",
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
      sender_id: swiperId,
      receiver_id: targetUserId,
      type: "MATCH",
      message: "It's a match 🎉",
    }),
    createNotification({
      sender_id: targetUserId,
      receiver_id: swiperId,
      type: "MATCH",
      message: "It's a match 🎉",
    }),
  ]).catch(console.error);

  return {
    matched: true,
    matchId: match.id,
  };
};