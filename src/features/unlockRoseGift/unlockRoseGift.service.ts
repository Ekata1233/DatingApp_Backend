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

import { MessageType, Prisma, TransactionSource, TransactionStatus, TransactionType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { AppError } from "../rose/AppError";

// export const incrementRoseAndGiftMessages = async (
//   senderId: string,
//   receiverId: string,
// ) => {
//   const now = new Date();

//   // ==========================================
//   // Get pending ROSE
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

//   // ==========================================
//   // Get pending GIFT
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

//   // Nothing pending
//   if (!pendingRose && !pendingGift) {
//     return {
//       rose: null,
//       gift: null,
//     };
//   }

//    // =========================================================
//   // 3. Check whether BOTH belong to the same ENGAGEMENT bundle
//   // =========================================================
//   //
//   // Bundle message contains:
//   //
//   // {
//   //   messageType: "ENGAGEMENT",
//   //   metadata: {
//   //     isBundle: true
//   //   },
//   //   roseId: "...",
//   //   giftId: "..."
//   // }
//   //
//   // Therefore, if the pending Rose ID and Gift ID are linked
//   // through the same bundle, increment BOTH.
//   //
//   // =========================================================

//   let isBundle = false;

//   if (pendingRose && pendingGift) {
//     const bundleMessage = await prisma.chatMessage.findFirst({
//       where: {
//         messageType: "ENGAGEMENT",
//         roseId: pendingRose.id,
//         giftId: pendingGift.id,
//         metadata: {
//           path: ["isBundle"],
//           equals: true,
//         },
//       },
//       orderBy: {
//         createdAt: "asc",
//       },
//     });

//     isBundle = !!bundleMessage;
//   }

//   // =========================================================
//   // 4. BUNDLE
//   // =========================================================
//   //
//   // One normal message should increase:
//   //
//   // Rose  0 -> 1
//   // Gift  0 -> 1
//   //
//   // If requiredMessages = 25:
//   //
//   // 1st message => 1 / 25 both
//   // 2nd message => 2 / 25 both
//   // ...
//   // 25th message => unlocked both
//   //
//   // =========================================================

//   if (isBundle && pendingRose && pendingGift) {
//     const newRoseMessagesSent = pendingRose.messagesSent + 1;
//     const newGiftMessagesSent = pendingGift.messagesSent + 1;

//     const [rose, gift] = await prisma.$transaction([
//       prisma.userRose.update({
//         where: {
//           id: pendingRose.id,
//         },
//         data: {
//           messagesSent: newRoseMessagesSent,

//           ...(newRoseMessagesSent >= pendingRose.requiredMessages
//             ? {
//                 isUnlocked: true,
//                 unlockedAt: now,
//               }
//             : {}),
//         },
//       }),

//       prisma.userGift.update({
//         where: {
//           id: pendingGift.id,
//         },
//         data: {
//           messagesSent: newGiftMessagesSent,

//           ...(newGiftMessagesSent >= pendingGift.requiredMessages
//             ? {
//                 isUnlocked: true,
//                 unlockedAt: now,
//               }
//             : {}),
//         },
//       }),
//     ]);

//     return {
//       rose,
//       gift,
//     };
//   }

//   // ==========================================
//   // Decide which reward comes FIRST
//   // ==========================================

//   let rewardType: "rose" | "gift";

//   if (!pendingRose) {
//     rewardType = "gift";
//   } else if (!pendingGift) {
//     rewardType = "rose";
//   } else {
//     rewardType =
//       pendingGift.createdAt <= pendingRose.createdAt
//         ? "gift"
//         : "rose";
//   }

//   // ==========================================
//   // INCREMENT ONLY ONE REWARD
//   // ==========================================

//   if (rewardType === "gift") {
//     const newMessagesSent = pendingGift!.messagesSent + 1;

//     const gift = await prisma.userGift.update({
//       where: {
//         id: pendingGift!.id,
//       },
//       data: {
//         messagesSent: newMessagesSent,

//         ...(newMessagesSent >= pendingGift!.requiredMessages
//           ? {
//               isUnlocked: true,
//               unlockedAt: now,
//             }
//           : {}),
//       },
//     });

//     return {
//       rose: null,
//       gift,
//     };
//   }

//   // ==========================================
//   // ROSE
//   // ==========================================

//   const newMessagesSent = pendingRose!.messagesSent + 1;

//   const rose = await prisma.userRose.update({
//     where: {
//       id: pendingRose!.id,
//     },
//     data: {
//       messagesSent: newMessagesSent,

//       ...(newMessagesSent >= pendingRose!.requiredMessages
//         ? {
//             isUnlocked: true,
//             unlockedAt: now,
//           }
//         : {}),
//     },
//   });

//   return {
//     rose,
//     gift: null,
//   };
// };

export const incrementRoseAndGiftMessages = async (
  senderId: string,
  receiverId: string,
) => {
  const now = new Date();

  return prisma.$transaction(
    async (tx) => {
      // =====================================================
      // IMPORTANT
      //
      // senderId   = person sending normal chat message
      // receiverId = person receiving normal chat message
      //
      // If A gave reward to B:
      //
      // reward.senderId   = A
      // reward.receiverId = B
      //
      // When B messages A:
      //
      // senderId   = B
      // receiverId = A
      //
      // therefore:
      //
      // reward.senderId   = receiverId
      // reward.receiverId = senderId
      // =====================================================

      // =====================================================
      // GET PENDING ROSE
      // =====================================================

      const pendingRose =
        await tx.userRose.findFirst({
          where: {
            senderId: receiverId,
            receiverId: senderId,

            isUnlocked: false,

            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: now,
                },
              },
            ],
          },

          orderBy: {
            createdAt: "asc",
          },
        });

      // =====================================================
      // GET PENDING GIFT
      // =====================================================

      const pendingGift =
        await tx.userGift.findFirst({
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

      // =====================================================
      // NOTHING PENDING
      // =====================================================

      if (
        !pendingRose &&
        !pendingGift
      ) {
        return {
          rose: null,
          gift: null,
          redeemed: [],
        };
      }

      // =====================================================
      // CHECK BUNDLE
      // =====================================================

      let isBundle = false;

      if (
        pendingRose &&
        pendingGift
      ) {
        const bundleMessage =
          await tx.chatMessage.findFirst({
            where: {
              messageType:
                MessageType.ENGAGEMENT,

              roseId:
                pendingRose.id,

              giftId:
                pendingGift.id,

              metadata: {
                path: [
                  "isBundle",
                ],

                equals: true,
              },
            },

            orderBy: {
              createdAt: "asc",
            },
          });

        isBundle =
          !!bundleMessage;
      }

      // =====================================================
      // BUNDLE
      // =====================================================

      if (
        isBundle &&
        pendingRose &&
        pendingGift
      ) {
        const newRoseMessages =
          pendingRose.messagesSent +
          1;

        const newGiftMessages =
          pendingGift.messagesSent +
          1;

        // -----------------------------------------
        // Update progress first
        // -----------------------------------------

        let rose =
          await tx.userRose.update({
            where: {
              id: pendingRose.id,
            },

            data: {
              messagesSent:
                newRoseMessages,
            },
          });

        let gift =
          await tx.userGift.update({
            where: {
              id: pendingGift.id,
            },

            data: {
              messagesSent:
                newGiftMessages,
            },
          });

        const redeemed: string[] =
          [];

        // -----------------------------------------
        // Redeem rose automatically
        // -----------------------------------------

        if (
          newRoseMessages >=
          pendingRose.requiredMessages
        ) {
          rose =
            await redeemRoseReward(
              pendingRose.id,
              tx,
            );

          redeemed.push("ROSE");
        }

        // -----------------------------------------
        // Redeem gift automatically
        // -----------------------------------------

        if (
          newGiftMessages >=
          pendingGift.requiredMessages
        ) {
          gift =
            await redeemGiftReward(
              pendingGift.id,
              tx,
            );

          redeemed.push("GIFT");
        }

        return {
          rose,
          gift,
          redeemed,
        };
      }

      // =====================================================
      // DETERMINE OLDEST REWARD
      // =====================================================

      let rewardType:
        | "rose"
        | "gift";

      if (!pendingRose) {
        rewardType = "gift";
      } else if (!pendingGift) {
        rewardType = "rose";
      } else {
        rewardType =
          pendingGift.createdAt <=
          pendingRose.createdAt
            ? "gift"
            : "rose";
      }

      // =====================================================
      // GIFT
      // =====================================================

      if (
        rewardType === "gift"
      ) {
        const newMessagesSent =
          pendingGift!
            .messagesSent + 1;

        let gift =
          await tx.userGift.update({
            where: {
              id: pendingGift!.id,
            },

            data: {
              messagesSent:
                newMessagesSent,
            },
          });

        let redeemed = false;

        // -----------------------------------------
        // Auto redeem
        // -----------------------------------------

        if (
          newMessagesSent >=
          pendingGift!
            .requiredMessages
        ) {
          gift =
            await redeemGiftReward(
              pendingGift!.id,
              tx,
            );

          redeemed = true;
        }

        return {
          rose: null,

          gift,

          redeemed:
            redeemed
              ? ["GIFT"]
              : [],
        };
      }

      // =====================================================
      // ROSE
      // =====================================================

      const newMessagesSent =
        pendingRose!.messagesSent +
        1;

      let rose =
        await tx.userRose.update({
          where: {
            id: pendingRose!.id,
          },

          data: {
            messagesSent:
              newMessagesSent,
          },
        });

      let redeemed = false;

      if (
        newMessagesSent >=
        pendingRose!
          .requiredMessages
      ) {
        rose =
          await redeemRoseReward(
            pendingRose!.id,
            tx,
          );

        redeemed = true;
      }

      return {
        rose,

        gift: null,

        redeemed:
          redeemed
            ? ["ROSE"]
            : [],
      };
    },
  );
};


export const redeemGiftReward = async (
  userGiftId: string,
  tx: Prisma.TransactionClient,
) => {
  // -------------------------------------------
  // 1. Get gift
  // -------------------------------------------

  const userGift = await tx.userGift.findUnique({
    where: {
      id: userGiftId,
    },
  });

  if (!userGift) {
    throw new AppError(404, "Gift not found.");
  }

  // -------------------------------------------
  // 2. Already redeemed/unlocked
  // -------------------------------------------

  if (userGift.isUnlocked) {
    return userGift;
  }

  // -------------------------------------------
  // 3. Requirement not completed
  // -------------------------------------------

  if (
    userGift.messagesSent <
    userGift.requiredMessages
  ) {
    return userGift;
  }

  // -------------------------------------------
  // 4. Prevent duplicate wallet credit
  // -------------------------------------------

  const existingRedeemTransaction =
    await tx.walletTransaction.findFirst({
      where: {
        referenceId: userGift.id,
        source:
          TransactionSource.GIFT_REDEEM,
        status:
          TransactionStatus.SUCCESS,
      },
    });

  if (existingRedeemTransaction) {
    // Wallet already credited.
    // Just make sure reward is unlocked.

    return tx.userGift.update({
      where: {
        id: userGift.id,
      },
      data: {
        isUnlocked: true,
        unlockedAt:
          userGift.unlockedAt ??
          new Date(),
      },
    });
  }

  // -------------------------------------------
  // 5. Receiver wallet
  // -------------------------------------------

  let wallet = await tx.wallet.findUnique({
    where: {
      userId: userGift.receiverId,
    },
  });

  // Create wallet if user does not have one
  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId: userGift.receiverId,
        balance: new Prisma.Decimal(0),
      },
    });
  }

  const redeemAmount = 10; // Assuming each rose is worth 10 units of currency
    new Prisma.Decimal(
      userGift.pricePaid,
    );

  const balanceBefore =
    wallet.balance;

  const balanceAfter =
    wallet.balance.plus(
      redeemAmount,
    );

  // -------------------------------------------
  // 6. Credit receiver wallet
  // -------------------------------------------

  await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        increment: redeemAmount,
      },
    },
  });

  // -------------------------------------------
  // 7. Create redeem transaction
  // -------------------------------------------

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,

      amount: redeemAmount,

      type: TransactionType.REWARD,

      status:
        TransactionStatus.SUCCESS,

      source:
        TransactionSource.GIFT_REDEEM,

      referenceId: userGift.id,

      description: `Gift "${userGift.giftName}" redeemed`,

      balanceBefore,

      balanceAfter,
    },
  });

  // -------------------------------------------
  // 8. Unlock gift
  // -------------------------------------------

  const unlockedGift =
    await tx.userGift.update({
      where: {
        id: userGift.id,
      },
      data: {
        isUnlocked: true,
        unlockedAt: new Date(),
      },
    });

  return unlockedGift;
};

export const redeemRoseReward = async (
  userRoseId: string,
  tx: Prisma.TransactionClient,
) => {
  // -------------------------------------------
  // 1. Get rose
  // -------------------------------------------

  const userRose =
    await tx.userRose.findUnique({
      where: {
        id: userRoseId,
      },
    });

  if (!userRose) {
    throw new AppError(
      404,
      "Rose not found.",
    );
  }

  // -------------------------------------------
  // 2. Already unlocked
  // -------------------------------------------

  if (userRose.isUnlocked) {
    return userRose;
  }

  // -------------------------------------------
  // 3. Requirement not completed
  // -------------------------------------------

  if (
    userRose.messagesSent <
    userRose.requiredMessages
  ) {
    return userRose;
  }

  // -------------------------------------------
  // 4. Prevent duplicate credit
  // -------------------------------------------

  const existingRedeemTransaction =
    await tx.walletTransaction.findFirst({
      where: {
        referenceId: userRose.id,

        source:
          TransactionSource.ROSE_REDEEM,

        status:
          TransactionStatus.SUCCESS,
      },
    });

  if (existingRedeemTransaction) {
    return tx.userRose.update({
      where: {
        id: userRose.id,
      },
      data: {
        isUnlocked: true,
        unlockedAt:
          userRose.unlockedAt ??
          new Date(),
      },
    });
  }

  // -------------------------------------------
  // 5. Receiver wallet
  // -------------------------------------------

  let wallet = await tx.wallet.findUnique({
    where: {
      userId: userRose.receiverId,
    },
  });

  if (!wallet) {
    wallet = await tx.wallet.create({
      data: {
        userId: userRose.receiverId,
        balance: new Prisma.Decimal(0),
      },
    });
  }

  const redeemAmount = 10; // Assuming each rose is worth 10 units of currency

  const balanceBefore =
    wallet.balance;

  const balanceAfter =
    wallet.balance.plus(
      redeemAmount,
    );

  // -------------------------------------------
  // 6. Add balance
  // -------------------------------------------

  await tx.wallet.update({
    where: {
      id: wallet.id,
    },
    data: {
      balance: {
        increment: redeemAmount,
      },
    },
  });

  // -------------------------------------------
  // 7. Wallet transaction
  // -------------------------------------------

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,

      amount: redeemAmount,

      type:
        TransactionType.REWARD,

      status:
        TransactionStatus.SUCCESS,

      source:
        TransactionSource.ROSE_REDEEM,

      referenceId: userRose.id,

      description:
        "Rose redeemed",

      balanceBefore,

      balanceAfter,
    },
  });

  // -------------------------------------------
  // 8. Unlock
  // -------------------------------------------

  const unlockedRose =
    await tx.userRose.update({
      where: {
        id: userRose.id,
      },
      data: {
        isUnlocked: true,
        unlockedAt: new Date(),
      },
    });

  return unlockedRose;
};