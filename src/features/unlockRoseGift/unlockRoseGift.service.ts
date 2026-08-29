// import { prisma } from "../../prisma/prismaClient";


// export const incrementRoseAndGiftMessages = async (
//   senderId: string,
//   receiverId: string,
// ) => {
//   const now = new Date();

//   // ==========================================
//   // ROSE
//   // ==========================================

//   const pendingRose = await prisma.userRose.findFirst({
//     where: {
//       senderId: receiverId,
//       receiverId: senderId,
//       isUnlocked: false,
//       expiresAt: {
//         gt: now,
//       },
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   });

//   let rose = null;

//   if (pendingRose) {
//     const newMessagesSent = pendingRose.messagesSent + 1;

//     rose = await prisma.userRose.update({
//       where: {
//         id: pendingRose.id,
//       },
//       data: {
//         messagesSent: newMessagesSent,

//         ...(newMessagesSent >= pendingRose.requiredMessages
//           ? {
//               isUnlocked: true,
//               unlockedAt: now,
//             }
//           : {}),
//       },
//     });
//   }

//   // ==========================================
//   // GIFT
//   // ==========================================

//   const pendingGift = await prisma.userGift.findFirst({
//     where: {
//       senderId: receiverId,
//       receiverId: senderId,
//       isUnlocked: false,
//       expiresAt: {
//         gt: now,
//       },
//     },
//     orderBy: {
//       createdAt: "asc",
//     },
//   });

//   let gift = null;

//   if (pendingGift) {
//     const newMessagesSent = pendingGift.messagesSent + 1;

//     gift = await prisma.userGift.update({
//       where: {
//         id: pendingGift.id,
//       },
//       data: {
//         messagesSent: newMessagesSent,

//         ...(newMessagesSent >= pendingGift.requiredMessages
//           ? {
//               isUnlocked: true,
//               unlockedAt: now,
//             }
//           : {}),
//       },
//     });
//   }

//   return {
//     rose,
//     gift,
//   };
// };

import { prisma } from "../../prisma/prismaClient";

export const incrementRoseAndGiftMessages = async (
  senderId: string,
  receiverId: string,
) => {
  const now = new Date();

  // ==========================================
  // Get pending ROSE
  // ==========================================

  const pendingRose = await prisma.userRose.findFirst({
    where: {
      senderId: receiverId,
      receiverId: senderId,
      isUnlocked: false,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // ==========================================
  // Get pending GIFT
  // ==========================================

  const pendingGift = await prisma.userGift.findFirst({
    where: {
      senderId: receiverId,
      receiverId: senderId,
      isUnlocked: false,
      expiresAt: {
        gt: now,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Nothing pending
  if (!pendingRose && !pendingGift) {
    return {
      rose: null,
      gift: null,
    };
  }

  // ==========================================
  // Decide which reward comes FIRST
  // ==========================================

  let rewardType: "rose" | "gift";

  if (!pendingRose) {
    rewardType = "gift";
  } else if (!pendingGift) {
    rewardType = "rose";
  } else {
    rewardType =
      pendingGift.createdAt <= pendingRose.createdAt
        ? "gift"
        : "rose";
  }

  // ==========================================
  // INCREMENT ONLY ONE REWARD
  // ==========================================

  if (rewardType === "gift") {
    const newMessagesSent = pendingGift!.messagesSent + 1;

    const gift = await prisma.userGift.update({
      where: {
        id: pendingGift!.id,
      },
      data: {
        messagesSent: newMessagesSent,

        ...(newMessagesSent >= pendingGift!.requiredMessages
          ? {
              isUnlocked: true,
              unlockedAt: now,
            }
          : {}),
      },
    });

    return {
      rose: null,
      gift,
    };
  }

  // ==========================================
  // ROSE
  // ==========================================

  const newMessagesSent = pendingRose!.messagesSent + 1;

  const rose = await prisma.userRose.update({
    where: {
      id: pendingRose!.id,
    },
    data: {
      messagesSent: newMessagesSent,

      ...(newMessagesSent >= pendingRose!.requiredMessages
        ? {
            isUnlocked: true,
            unlockedAt: now,
          }
        : {}),
    },
  });

  return {
    rose,
    gift: null,
  };
};