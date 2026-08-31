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

   // =========================================================
  // 3. Check whether BOTH belong to the same ENGAGEMENT bundle
  // =========================================================
  //
  // Bundle message contains:
  //
  // {
  //   messageType: "ENGAGEMENT",
  //   metadata: {
  //     isBundle: true
  //   },
  //   roseId: "...",
  //   giftId: "..."
  // }
  //
  // Therefore, if the pending Rose ID and Gift ID are linked
  // through the same bundle, increment BOTH.
  //
  // =========================================================

  let isBundle = false;

  if (pendingRose && pendingGift) {
    const bundleMessage = await prisma.chatMessage.findFirst({
      where: {
        messageType: "ENGAGEMENT",
        roseId: pendingRose.id,
        giftId: pendingGift.id,
        metadata: {
          path: ["isBundle"],
          equals: true,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    isBundle = !!bundleMessage;
  }

  // =========================================================
  // 4. BUNDLE
  // =========================================================
  //
  // One normal message should increase:
  //
  // Rose  0 -> 1
  // Gift  0 -> 1
  //
  // If requiredMessages = 25:
  //
  // 1st message => 1 / 25 both
  // 2nd message => 2 / 25 both
  // ...
  // 25th message => unlocked both
  //
  // =========================================================

  if (isBundle && pendingRose && pendingGift) {
    const newRoseMessagesSent = pendingRose.messagesSent + 1;
    const newGiftMessagesSent = pendingGift.messagesSent + 1;

    const [rose, gift] = await prisma.$transaction([
      prisma.userRose.update({
        where: {
          id: pendingRose.id,
        },
        data: {
          messagesSent: newRoseMessagesSent,

          ...(newRoseMessagesSent >= pendingRose.requiredMessages
            ? {
                isUnlocked: true,
                unlockedAt: now,
              }
            : {}),
        },
      }),

      prisma.userGift.update({
        where: {
          id: pendingGift.id,
        },
        data: {
          messagesSent: newGiftMessagesSent,

          ...(newGiftMessagesSent >= pendingGift.requiredMessages
            ? {
                isUnlocked: true,
                unlockedAt: now,
              }
            : {}),
        },
      }),
    ]);

    return {
      rose,
      gift,
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