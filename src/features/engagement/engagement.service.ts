import { MessageType, PrismaClient } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { getOrCreateConversation } from "../chat/chat.helper";
import { AppError } from "../rose/AppError";
import {
  checkBlockedStatus,
  checkMatch,
  getOrCreateBalance,
} from "../rose/rose.repository";
import { SendEngagementDTO } from "./engagement.validation";
import { SendEngagementResponse } from "./engagement.types";
import { createBundleRose, validateRoseForBundle } from "../rose/rose.helper";
import { createBundleCompliment } from "../compliment/compliment.helper";
import { createBundleGift } from "../gift/gift.helper";
import { updateEngagementProgress } from "./engagement.helper";
import { createNotification } from "../notification/notification.service";

// export const sendEngagementService = async (
//     senderId: string,
//     data: SendEngagementDTO
// ): Promise<SendEngagementResponse> => {
//     const {
//         receiverId,
//         targetType,
//         targetId,
//         rose: roseData,
//         compliment: complimentData,
//         gift: giftData,
//     } = data;

//     // --------------------------------------------------
//     // 1. BASIC VALIDATIONS
//     // --------------------------------------------------

//     if (senderId === receiverId) {
//         throw new AppError(400, "CANNOT_SEND_TO_SELF");
//     }

//     // --------------------------------------------------
//     // 2. BLOCK CHECK
//     // --------------------------------------------------

//     const isBlocked = await checkBlockedStatus(
//         senderId,
//         receiverId,
//         prisma
//     );

//     if (isBlocked) {
//         throw new AppError(403, "BLOCKED_USER");
//     }

//     // --------------------------------------------------
//     // 3. MATCH CHECK
//     // --------------------------------------------------

//     const isMatched = await checkMatch(
//         senderId,
//         receiverId,
//         prisma
//     );

//     if (isMatched) {
//         throw new AppError(
//             400,
//             "ALREADY_MATCHED"
//         );
//     }

//     // --------------------------------------------------
//     // 4. ROSE-SPECIFIC VALIDATIONS
//     // --------------------------------------------------

//     if (roseData) {
//         await validateRoseForBundle(
//             senderId,
//             receiverId
//         );
//     }

//     // --------------------------------------------------
//     // 5. TRANSACTION
//     // --------------------------------------------------

//     return prisma.$transaction(
//         async (tx) => {

//             let roseId: string | null = null;
//             let complimentId: string | null = null;
//             let giftId: string | null = null;

//             // =================================================
//             // ROSE
//             // =================================================

//             if (roseData) {

//                 const roseResult =
//                     await createBundleRose(
//                         senderId,
//                         receiverId,
//                         roseData,
//                         targetType,
//                         targetId,
//                         tx
//                     );

//                 console.log("rose result : ", roseResult)

//                 roseId = roseResult.roseId;
//             }

//             // =================================================
//             // COMPLIMENT
//             // =================================================

//             if (complimentData) {

//                 const compliment =
//                     await createBundleCompliment(
//                         senderId,
//                         receiverId,
//                         complimentData,
//                         targetType,
//                         targetId,
//                         tx
//                     );

//                 console.log("compliment result : ", compliment)

//                 complimentId = compliment.compliment.id;
//             }

//             // =================================================
//             // GIFT
//             // =================================================

//             if (giftData) {

//                 const gift =
//                     await createBundleGift(
//                         senderId,
//                         receiverId,
//                         giftData,
//                         targetType,
//                         targetId,
//                         tx
//                     );

//                 console.log("gift result : ", gift)

//                 giftId = gift.userGift.id;
//             }

//             // =================================================
//             // CONVERSATION
//             // =================================================

//             const conversation =
//                 await getOrCreateConversation(
//                     senderId,
//                     receiverId,
//                     tx
//                 );

//             // =================================================
//             // MESSAGE TYPE
//             // =================================================

//             const engagementCount =
//                 Number(!!roseId) +
//                 Number(!!complimentId) +
//                 Number(!!giftId);

//             let messageType: MessageType;

//             if (engagementCount > 1) {
//                 messageType = MessageType.ENGAGEMENT;
//             } else if (roseId) {
//                 messageType = MessageType.ROSE;
//             } else if (complimentId) {
//                 messageType = MessageType.COMPLIMENT;
//             } else {
//                 messageType = MessageType.GIFT;
//             }

//             // =================================================
//             // CREATE ONE CHAT MESSAGE
//             // =================================================

//             const chatMessage =
//                 await tx.chatMessage.create({
//                     data: {
//                         conversationId: conversation.id,
//                         senderId,

//                         messageType,

//                         roseId,
//                         complimentId,
//                         giftId,

//                         metadata: {
//                             isBundle: true,
//                         },
//                     },

//                     include: {
//                         rose: true,
//                         compliment: true,
//                         gift: true,
//                     },
//                 });

//             // =================================================
//             // PROGRESS +1 ONLY ONCE
//             // =================================================

//             // await updateEngagementProgress(
//             //     tx,
//             //     senderId,
//             //     receiverId
//             // );

//             // =================================================
//             // UPDATE CONVERSATION
//             // =================================================

//             await tx.conversation.update({
//                 where: {
//                     id: conversation.id,
//                 },
//                 data: {
//                     updatedAt: new Date(),
//                 },
//             });

//             // =================================================
//             // BALANCE
//             // =================================================

//             const updatedBalance =
//                 await getOrCreateBalance(
//                     senderId,
//                     tx as any
//                 );

//             // =================================================
//             // RETURN
//             // =================================================

//             return {
//                 success: true,

//                 message:
//                     "Engagement sent successfully",

//                 data: {
//                     message: chatMessage,

//                     remainingBalance: {
//                         totalRoses:
//                             updatedBalance.totalRoses,
//                         lastResetAt:
//                             updatedBalance.lastResetAt,
//                     },
//                 },
//             };
//         }
//     );
// };

export const sendEngagementService = async (
  senderId: string,
  data: SendEngagementDTO,
): Promise<SendEngagementResponse> => {
  const {
    receiverId,
    targetType = null,
    targetId = null,
    rose: roseData,
    compliment: complimentData,
    gift: giftData,
  } = data;

  // ============================================
  // 1. VALIDATIONS
  // ============================================

  if (senderId === receiverId) {
    throw new AppError(400, "CANNOT_SEND_TO_SELF");
  }

  if (!roseData && !complimentData && !giftData) {
    throw new AppError(400, "AT_LEAST_ONE_ENGAGEMENT_REQUIRED");
  }

  const isBlocked = await checkBlockedStatus(senderId, receiverId, prisma);

  if (isBlocked) {
    throw new AppError(403, "BLOCKED_USER");
  }

  const isMatched = await checkMatch(senderId, receiverId, prisma);

  if (isMatched) {
    throw new AppError(400, "ALREADY_MATCHED");
  }

  if ((targetType === "PHOTO" || targetType === "PROMPT") && !targetId) {
    throw new AppError(400, "TARGET_ID_REQUIRED");
  }

  if (targetId && targetType !== "PHOTO" && targetType !== "PROMPT") {
    throw new AppError(400, "TARGET_ID_NOT_ALLOWED");
  }

  if (roseData) {
    await validateRoseForBundle(senderId, receiverId);
  }

  // ============================================
  // 2. TRANSACTION
  // ============================================

  const result = await prisma.$transaction(async (tx) => {
    let roseId: string | null = null;
    let complimentId: string | null = null;
    let giftId: string | null = null;

    let rosePayment: {
      method: "ROSE_BALANCE" | "WALLET";
      amount: number;
      walletBalance: string | null;
    } | null = null;

    let complimentPayment: {
      method: "COMPLIMENT_BALANCE" | "WALLET";
      amount: number;
      walletBalance: string | null;
    } | null = null;

    let giftPayment: {
      method: "WALLET";
      amount: number;
      walletBalance: string;
    } | null = null;

    let complimentContent: string | null = null;
    let giftMediaUrl: string | null = null;
    let giftName: string | null = null;

    let remainingComplimentBalance: {
      totalCompliments: number;
      lastResetAt: Date | null;
    } | null = null;

    let matched = false;
    let matchId: string | null = null;

    // ========================================
    // 3. CHECK REVERSE LIKE FOR ROSE
    // ========================================

    let hasReverseLike = false;

    if (roseData) {
      const reverseSwipe = await tx.userSwipe.findUnique({
        where: {
          swiperId_targetUserId: {
            swiperId: receiverId,
            targetUserId: senderId,
          },
        },
        select: {
          action: true,
        },
      });

      hasReverseLike =
        reverseSwipe?.action === "LIKE" || reverseSwipe?.action === "SUPERLIKE";
    }

    // ========================================
    // 4. CREATE ROSE
    // ========================================

    if (roseData) {
      const roseResult = await createBundleRose(
        senderId,
        receiverId,
        roseData,
        targetType,
        targetId,
        tx,
      );

      roseId = roseResult.roseId;
      rosePayment = roseResult.payment;
    }

    // ========================================
    // 5. CREATE COMPLIMENT
    // ========================================

    if (complimentData) {
      const complimentResult = await createBundleCompliment(
        senderId,
        receiverId,
        complimentData,
        targetType,
        targetId,
        tx,
      );

      complimentId = complimentResult.compliment.id;

      complimentContent = complimentResult.chatContent;

      complimentPayment = complimentResult.payment;

      remainingComplimentBalance = complimentResult.remainingBalance;
    }

    // ========================================
    // 6. CREATE GIFT
    // ========================================

    if (giftData) {
      const giftResult = await createBundleGift(
        senderId,
        receiverId,
        giftData,
        targetType,
        targetId,
        tx,
      );

      giftId = giftResult.userGift.id;
      giftMediaUrl = giftResult.mediaUrl;
      giftName = giftResult.userGift.giftName;

      giftPayment = {
        method: "WALLET",
        amount: Number(giftResult.userGift.pricePaid),
        walletBalance: giftResult.walletBalance.toString(),
      };
    }

    // ========================================
    // 7. GET OR CREATE CONVERSATION
    // ========================================

    const conversation = await getOrCreateConversation(
      senderId,
      receiverId,
      tx,
    );

    // ========================================
    // 8. AUTO MATCH WHEN ROSE INCLUDED
    // ========================================

    if (roseId && hasReverseLike) {
      const existingSenderSwipe = await tx.userSwipe.findUnique({
        where: {
          swiperId_targetUserId: {
            swiperId: senderId,
            targetUserId: receiverId,
          },
        },
      });

      if (existingSenderSwipe?.action === "PASS") {
        throw new AppError(400, "ROSE_MATCH_REQUIRES_SWIPE_RESET");
      }

      if (!existingSenderSwipe) {
        await tx.userSwipe.create({
          data: {
            swiperId: senderId,
            targetUserId: receiverId,
            action: "LIKE",
            isMutual: true,
          },
        });
      } else {
        await tx.userSwipe.update({
          where: {
            swiperId_targetUserId: {
              swiperId: senderId,
              targetUserId: receiverId,
            },
          },
          data: {
            isMutual: true,
          },
        });
      }

      await tx.userSwipe.update({
        where: {
          swiperId_targetUserId: {
            swiperId: receiverId,
            targetUserId: senderId,
          },
        },
        data: {
          isMutual: true,
        },
      });

      const [user1Id, user2Id] = [senderId, receiverId].sort();

      const match = await tx.userMatch.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        create: {
          user1Id,
          user2Id,
          is_active: true,
          is_deleted: false,
        },
        update: {},
      });

      matched = true;
      matchId = match.id;
    }

    // ========================================
    // 9. MESSAGE TYPE
    // ========================================

    const engagementCount =
      Number(!!roseId) + Number(!!complimentId) + Number(!!giftId);

    let messageType: MessageType;

    if (engagementCount > 1) {
      messageType = MessageType.ENGAGEMENT;
    } else if (roseId) {
      messageType = MessageType.ROSE;
    } else if (complimentId) {
      messageType = MessageType.COMPLIMENT;
    } else {
      messageType = MessageType.GIFT;
    }

    // ========================================
    // 10. CREATE ONE CHAT MESSAGE
    // ========================================

    const chatMessage = await tx.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId,
        messageType,
        roseId,
        complimentId,
        giftId,
        content: complimentContent,
        mediaUrl: giftMediaUrl,
        metadata: {
          isBundle: engagementCount > 1,
          targetType,
          targetId,
          roseId,
          complimentId,
          giftId,
          matched,
          matchId,
        },
      },
    });

    // ========================================
    // 11. UPDATE CONVERSATION
    // ========================================

    await tx.conversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // ========================================
    // 12. UPDATED ROSE BALANCE
    // ========================================

    const updatedRoseBalance = await getOrCreateBalance(
      senderId,
      tx as unknown as PrismaClient,
    );

    // ========================================
    // 13. FINAL WALLET BALANCE
    // ========================================

    const wallet = await tx.wallet.findUnique({
      where: {
        userId: senderId,
      },
      select: {
        balance: true,
      },
    });

    // ========================================
    // 14. RETURN TRANSACTION DATA
    // ========================================

    return {
      success: true as const,

      message: matched
        ? "Engagement sent successfully. It's a Match! ❤️"
        : "Engagement sent successfully",

      data: {
        matched,
        matchId,

        message: chatMessage,

        rose: roseId ? { id: roseId } : null,

        compliment: complimentId ? { id: complimentId } : null,

        gift: giftId
          ? {
              id: giftId,
              name: giftName ?? "",
            }
          : null,

        payment: {
          rose: rosePayment,
          compliment: complimentPayment,
          gift: giftPayment,

          walletBalance: wallet?.balance.toString() ?? null,
        },

        remainingBalance: {
          totalRoses: updatedRoseBalance.totalRoses,

          lastResetAt: updatedRoseBalance.lastResetAt,
        },

        remainingComplimentBalance,
      },
    };
  });

  const [sender, receiver] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: senderId,
      },
      select: {
        full_name: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: receiverId,
      },
      select: {
        full_name: true,
      },
    }),
  ]);

  const senderName = sender?.full_name?.trim() || "Someone";
  const receiverName = receiver?.full_name?.trim() || "Someone";

  // ============================================
  // 15. NOTIFICATIONS AFTER COMMIT
  // ============================================

  const notifications: Promise<unknown>[] = [];

  if (result.data.rose) {
    notifications.push(
      createNotification({
        senderId,
        receiverId,
        type: "NEW_ROSE",
        title: "You received a Rose 🌹",
        message: `${senderName} sent you a rose 🌹`,
        data: {
          type: "ROSE",
          roseId: result.data.rose.id,
          senderId,
          receiverId,
          targetType,
          targetId,
        },
      }),
    );
  }

  if (result.data.compliment) {
    notifications.push(
      createNotification({
        senderId,
        receiverId,
        type: "NEW_COMPLIMENT",
        title: "You received a Compliment 💬",
        message: `${senderName} sent you a compliment 💬`,
        data: {
          type: "COMPLIMENT",
          complimentId: result.data.compliment.id,
          senderId,
          receiverId,
          targetType,
          targetId,
        },
      }),
    );
  }

  if (result.data.gift) {
    notifications.push(
      createNotification({
        senderId,
        receiverId,
        type: "NEW_GIFT",
        title: "You received a gift 🎁",
        message: `${senderName} sent you ${result.data.gift.name} 🎁`,
        data: {
          type: "GIFT",
          giftId: result.data.gift.id,
          giftName: result.data.gift.name,
          senderId,
          receiverId,
          targetType,
          targetId,
        },
      }),
    );
  }

  if (result.data.matched && result.data.matchId) {
    const matchId = result.data.matchId;

    notifications.push(
      createNotification({
        senderId,
        receiverId,
        type: "NEW_MATCH",
        title: "It's a Match! 🎉",
        message: "You both liked each other ❤️",
        data: {
          type: "MATCH",
          matchId,
          userId: senderId,
        },
      }),
    );

    notifications.push(
      createNotification({
        senderId: receiverId,
        receiverId: senderId,
        type: "NEW_MATCH",
        title: "It's a Match! 🎉",
        message: "You both liked each other ❤️",
        data: {
          type: "MATCH",
          matchId,
          userId: receiverId,
        },
      }),
    );
  }

  // A notification failure must not roll back
  // an already committed engagement.
  const notificationResults = await Promise.allSettled(notifications);

  notificationResults.forEach((notificationResult, index) => {
    if (notificationResult.status === "rejected") {
      console.error(
        "Engagement notification failed:",
        index,
        notificationResult.reason,
      );
    }
  });

  return result;
};
