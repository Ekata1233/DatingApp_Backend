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

  // 1. Save swipe
  await createSwipe({ swiperId, targetUserId, action });

  // Only LIKE / SUPERLIKE can create match
  if (action === "PASS") {
    return { matched: false };
  }
  /**
   * ----------------------------------------
   * 2. Send LIKE/SUPERLIKE notification
   * ----------------------------------------
   */
  await createNotification({
    sender_id: swiperId,
    receiver_id: targetUserId,
    type: "LIKE",
    message:
      action === "SUPERLIKE"
        ? "Someone super liked your profile ⭐"
        : "Someone liked your profile ❤️",
  });

  // 2. Check reverse like
  const reverse = await checkReverseLike(swiperId, targetUserId);

  if (!reverse) {
    return { matched: false };
  }

  // 3. Prevent duplicate match
  const existingMatch = await checkMatchExists(
    swiperId,
    targetUserId
  );

  if (existingMatch) {
    return { matched: true, matchId: existingMatch.id };
  }

  // 4. Create match
  const match = await createMatch(swiperId, targetUserId);

  /**
   * ----------------------------------------
   * 6. Send MATCH notification to both users
   * ----------------------------------------
   */

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

