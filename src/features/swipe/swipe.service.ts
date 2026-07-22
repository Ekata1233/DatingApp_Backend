// // modules/swipe/swipe.service.ts

// import { prisma } from "../../prisma/prismaClient";
// import { SwipeParams } from "./swipe.types";

// export const swipeService = async ({
//   userId,
//   targetUserId,
//   action,
// }: SwipeParams) => {
//   if (userId === targetUserId) {
//     throw new Error("You cannot swipe yourself");
//   }

//   return await prisma.$transaction(async (tx) => {
//     // 1. Check if already swiped (idempotent)
//     const existingSwipe = await tx.userSwipe.findUnique({
//       where: {
//         swiperId_targetUserId: {
//           swiperId: userId,
//           targetUserId,
//         },
//       },
//     });

//     if (existingSwipe) {
//       return {
//         message: "Already swiped",
//         isMatch: existingSwipe.isMutual,
//       };
//     }

//     // 2. Check reverse swipe (for MATCH)
//     const reverseSwipe = await tx.userSwipe.findUnique({
//       where: {
//         swiperId_targetUserId: {
//           swiperId: targetUserId,
//           targetUserId: userId,
//         },
//       },
//     });

//     let isMatch = false;

//     if (
//       reverseSwipe &&
//       reverseSwipe.action === "LIKE" &&
//       action === "LIKE"
//     ) {
//       isMatch = true;
//     }

//     // 3. Create swipe
//     const newSwipe = await tx.userSwipe.create({
//       data: {
//         swiperId: userId,
//         targetUserId,
//         action,
//         isMutual: isMatch,
//       },
//     });

//     // 4. If match → update reverse swipe + create match
//     if (isMatch) {
//       await tx.userSwipe.update({
//         where: {
//           swiperId_targetUserId: {
//             swiperId: targetUserId,
//             targetUserId: userId,
//           },
//         },
//         data: {
//           isMutual: true,
//         },
//       });

//       // OPTIONAL (recommended) → Match table
//       await tx.userMatch.create({
//         data: {
//           user1Id: userId,
//           user2Id: targetUserId,
//         },
//       });
//     }

//     return {
//       message: isMatch ? "It's a match!" : "Swipe recorded",
//       isMatch,
//       swipe: newSwipe,
//     };
//   });
// };

import { createNotification } from "../notification/notification.service";
import {
  createSwipe,
  checkReverseLike,
  createMatch,
  checkMatchExists,
  cacheSwipe,
  checkReverseLikeRedis,
  checkExistingSwipe,
} from "./swipe.repository";

export const handleSwipe = async (data: {
  swiperId: string;
  targetUserId: string;
  action: "LIKE" | "PASS" | "SUPERLIKE";
}) => {
  const { swiperId, targetUserId, action } = data;

  if (swiperId === targetUserId) {
    throw new Error("Cannot swipe yourself");
  }

    // 1. Check for duplicate swipe (idempotency)
  const existingSwipe = await checkExistingSwipe(swiperId, targetUserId);
  if (existingSwipe) {
    throw new Error("Already swiped on this user");
  }

  // Only LIKE / SUPERLIKE can create match
  if (action === "PASS") {
    // Save PASS swipe (no match possible)
    await createSwipe({ swiperId, targetUserId, action });
    await cacheSwipe(swiperId, targetUserId);
    return { matched: false };
  }

    let reverse = await checkReverseLikeRedis(swiperId, targetUserId);

  if (!reverse) {
    const dbReverse = await checkReverseLike(swiperId, targetUserId);
    if (dbReverse) {
      // Cache the reverse like for future lookups
      await cacheSwipe(targetUserId, swiperId);
      reverse = true;
    }
  }

  // 3. Save the swipe (after checking reverse to avoid race conditions)
  // Consider using a transaction here
  await createSwipe({ swiperId, targetUserId, action });
  await cacheSwipe(swiperId, targetUserId);
  // 4. If no reverse like, just send LIKE notification and return
  if (!reverse) {
    await createNotification({
      sender_id: swiperId,
      receiver_id: targetUserId,
      type: "LIKE",
      message:
        action === "SUPERLIKE"
          ? "Someone super liked your profile ⭐"
          : "Someone liked your profile ❤️",
    });
    return { matched: false };
  }

    // 5. Prevent duplicate match (race condition safe)
  const existingMatch = await checkMatchExists(swiperId, targetUserId);
  if (existingMatch) {
    return { matched: true, matchId: existingMatch.id };
  }

  // 6. Create match (consider using database transaction)
  const match = await createMatch(swiperId, targetUserId);

  // 7. Send notifications in parallel
  await Promise.all([
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
  ]);

  return {
    matched: true,
    matchId: match.id,
  };
};

