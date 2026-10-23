import { MessageType, Prisma } from "@prisma/client";
import { AppError } from "../../rose/AppError";
import { checkBlockedStatus, checkMatch } from "../../rose/rose.repository";
import { prisma } from "../../../prisma/prismaClient";
import { createBundleGift } from "../../gift/gift.helper";
import { isUserViewingConversation } from "../chat.helper";
import { createNotification } from "../../notification/notification.service";

// // Import from your existing modules:
// // AppError
// // checkBlockedStatus
// // checkMatch
// // createBundleGift
// // createNotification
// // isUserViewingConversation

// type SendSocketGiftInput = {
//   conversationId: string;
//   senderId: string;
//   receiverId: string;
//   giftId: string;
//   content?: string | null;
//   targetType?: "PHOTO" | "PROMPT" | null;
//   targetId?: string | null;
// };

// export const sendSocketGiftMessage = async (
//   data: SendSocketGiftInput,
// ) => {
//   const {
//     conversationId,
//     senderId,
//     receiverId,
//     giftId,
//     targetType = null,
//     targetId = null,
//   } = data;

//   // ==========================================
//   // 1. SELF VALIDATION
//   // ==========================================

//   if (senderId === receiverId) {
//     throw new AppError(
//       400,
//       "CANNOT_SEND_TO_SELF",
//     );
//   }

//   // ==========================================
//   // 2. BLOCK VALIDATION
//   // ==========================================

//   const isBlocked = await checkBlockedStatus(
//     senderId,
//     receiverId,
//     prisma,
//   );

//   if (isBlocked) {
//     throw new AppError(
//       403,
//       "BLOCKED_USER",
//     );
//   }

//   // ==========================================
//   // 3. MATCH VALIDATION
//   // ==========================================

//   const isMatched = await checkMatch(
//     senderId,
//     receiverId,
//     prisma,
//   );

//   // Matches your engagement service.
//   // Remove this restriction only if gifts
//   // should be allowed after matching.

//   if (isMatched) {
//     throw new AppError(
//       400,
//       "ALREADY_MATCHED",
//     );
//   }

//   // ==========================================
//   // 4. TARGET VALIDATION
//   // ==========================================

//   if (
//     (targetType === "PHOTO" ||
//       targetType === "PROMPT") &&
//     !targetId
//   ) {
//     throw new AppError(
//       400,
//       "TARGET_ID_REQUIRED",
//     );
//   }

//   if (
//     targetId &&
//     targetType !== "PHOTO" &&
//     targetType !== "PROMPT"
//   ) {
//     throw new AppError(
//       400,
//       "TARGET_ID_NOT_ALLOWED",
//     );
//   }

//   // ==========================================
//   // 5. RECEIVER VALIDATION
//   // ==========================================

//   const receiver = await prisma.user.findUnique({
//     where: {
//       id: receiverId,
//     },
//     select: {
//       id: true,
//       full_name: true,
//       account_status: true, // Adjust to your Prisma field
//       deleted_at: true,
//     },
//   });

//   if (
//     !receiver ||
//     receiver.deleted_at ||
//     receiver.account_status !== "ACTIVE"
//   ) {
//     throw new AppError(
//       404,
//       "RECEIVER_NOT_AVAILABLE",
//     );
//   }

//   // ==========================================
//   // 6. GIFT VALIDATION
//   // ==========================================

//   const gift = await prisma.gift.findUnique({
//     where: {
//       id: giftId,
//     },
//   });

//   if (!gift) {
//     throw new AppError(
//       404,
//       "GIFT_NOT_FOUND",
//     );
//   }

//   // ==========================================
//   // 7. ATOMIC GIFT PURCHASE + MESSAGE
//   // ==========================================

//   const result = await prisma.$transaction(
//     async (tx) => {
//       // Revalidate participants inside transaction.

//       const participants =
//         await tx.conversationParticipant.findMany({
//           where: {
//             conversationId,
//             userId: {
//               in: [senderId, receiverId],
//             },
//             deletedAt: null,
//           },
//           select: {
//             userId: true,
//           },
//         });

//       if (
//         participants.length !== 2 ||
//         !participants.some(
//           (p) => p.userId === senderId,
//         ) ||
//         !participants.some(
//           (p) => p.userId === receiverId,
//         )
//       ) {
//         throw new AppError(
//           403,
//           "INVALID_CONVERSATION_PARTICIPANTS",
//         );
//       }

//       // --------------------------------------
//       // MESSAGE UNLOCK VALIDATION
//       // --------------------------------------

//       const previousGiftCount =
//         await tx.userGift.count({
//           where: {
//             senderId,
//             receiverId,
//           },
//         });

//       const requiredMessages =
//         previousGiftCount === 0
//           ? 25
//           : previousGiftCount === 1
//             ? 5
//             : 1;

//       // IMPORTANT:
//       // Replace this count with the exact
//       // message-counting logic used by your
//       // existing sendGiftService.
//       //
//       // This example counts sender messages
//       // in the current conversation.

//       const sentMessageCount =
//         await tx.chatMessage.count({
//           where: {
//             conversationId,
//             senderId,
//             deletedAt: null,
//             messageType: {
//               in: [
//                 MessageType.TEXT,
//                 MessageType.IMAGE,
//                 MessageType.VIDEO,
//                 MessageType.AUDIO,
//                 MessageType.FILE,
//                 MessageType.LINK,
//               ],
//             },
//           },
//         });

//       if (sentMessageCount < requiredMessages) {
//         throw new AppError(
//           400,
//           `GIFT_LOCKED: ${requiredMessages} messages required`,
//         );
//       }

//       // --------------------------------------
//       // CREATE GIFT AND DEDUCT WALLET
//       // --------------------------------------

//       const giftResult = await createBundleGift(
//         senderId,
//         receiverId,
//         { giftId },
//         targetType,
//         targetId,
//         tx,
//       );

//       // createBundleGift must:
//       // - Validate gift pricing
//       // - Validate wallet balance
//       // - Deduct wallet amount
//       // - Record wallet transaction
//       // - Create userGift
//       //
//       // Do not deduct wallet again here.

//       // --------------------------------------
//       // CREATE CHAT MESSAGE
//       // --------------------------------------

//       const message = await tx.chatMessage.create({
//         data: {
//           conversationId,
//           senderId,

//           messageType: MessageType.GIFT,

//           giftId: giftResult.userGift.id,

//           content: null,

//           mediaUrl: giftResult.mediaUrl,

//           metadata: {
//             isBundle: false,
//             giftId: giftResult.userGift.id,
//             giftName: giftResult.userGift.giftName,
//             targetType,
//             targetId,
//             matched: false,
//           },
//         },
//       });

//       // --------------------------------------
//       // UPDATE CONVERSATION
//       // --------------------------------------

//       await tx.conversation.update({
//         where: {
//           id: conversationId,
//         },
//         data: {
//           updatedAt: new Date(),
//         },
//       });

//       return {
//         message,
//         gift: giftResult.userGift,
//         walletBalance:
//           giftResult.walletBalance.toString(),
//       };
//     },
//     {
//       isolationLevel:
//         Prisma.TransactionIsolationLevel.Serializable,
//       maxWait: 5000,
//       timeout: 10000,
//     },
//   );

//   // ==========================================
//   // 8. NOTIFICATION AFTER COMMIT
//   // ==========================================

//   try {
//     const sender = await prisma.user.findUnique({
//       where: {
//         id: senderId,
//       },
//       select: {
//         full_name: true,
//       },
//     });

//     const receiverViewingChat =
//       await isUserViewingConversation(
//         receiverId,
//         conversationId,
//       );

//     await createNotification({
//       senderId,
//       receiverId,
//       type: "NEW_GIFT",
//       title: "You received a gift 🎁",
//       message:
//         `${sender?.full_name?.trim() || "Someone"} ` +
//         `sent you ${result.gift.giftName} 🎁`,
//       data: {
//         type: "GIFT",
//         giftId: result.gift.id,
//         giftName: result.gift.giftName,
//         conversationId,
//         messageId: result.message.id,
//         senderId,
//         receiverId,
//         targetType,
//         targetId,
//       },

//       skipPush: receiverViewingChat,
//     });
//   } catch (error) {
//     console.error(
//       "GIFT NOTIFICATION ERROR:",
//       error,
//     );
//   }

//   return result;
// };

// Use your existing project imports for:
// AppError
// checkBlockedStatus
// checkMatch
// createBundleGift
// createNotification
// isUserViewingConversation

type SendSocketGiftInput = {
  conversationId: string;
  senderId: string;
  receiverId: string;

  // Catalog gift ID from metadata.giftId
  giftId: string;

  content?: string | null;

  targetType?: "PHOTO" | "PROMPT" | null;
  targetId?: string | null;
};

const GIFT_UNLOCK_MESSAGE_TYPES: MessageType[] = [
  MessageType.TEXT,
  MessageType.IMAGE,
  MessageType.VIDEO,
  MessageType.AUDIO,
  MessageType.FILE,
  MessageType.LINK,
];

export const sendSocketGiftMessage = async (data: SendSocketGiftInput) => {
  const {
    conversationId,
    senderId,
    receiverId,
    giftId,
    content = null,
    targetType = null,
    targetId = null,
  } = data;

  // ==========================================
  // 1. BASIC VALIDATIONS
  // ==========================================

  if (senderId === receiverId) {
    throw new AppError(400, "CANNOT_SEND_TO_SELF");
  }

  if (!giftId?.trim()) {
    throw new AppError(400, "GIFT_ID_REQUIRED");
  }

  if (
    targetType !== null &&
    targetType !== "PHOTO" &&
    targetType !== "PROMPT"
  ) {
    throw new AppError(400, "INVALID_TARGET_TYPE");
  }

  if ((targetType === "PHOTO" || targetType === "PROMPT") && !targetId) {
    throw new AppError(400, "TARGET_ID_REQUIRED");
  }

  if (targetId && !targetType) {
    throw new AppError(400, "TARGET_ID_NOT_ALLOWED");
  }

  // ==========================================
  // 2. VERIFY CONVERSATION PARTICIPANTS
  // ==========================================

  const participants = await prisma.conversationParticipant.findMany({
    where: {
      conversationId,
      userId: {
        in: [senderId, receiverId],
      },
      deletedAt: null,
    },
    select: {
      userId: true,
    },
  });

  const senderExists = participants.some(
    (participant) => participant.userId === senderId,
  );

  const receiverExists = participants.some(
    (participant) => participant.userId === receiverId,
  );

  if (participants.length !== 2 || !senderExists || !receiverExists) {
    throw new AppError(403, "INVALID_CONVERSATION_PARTICIPANTS");
  }

  // ==========================================
  // 3. BLOCK VALIDATION
  // ==========================================

  const isBlocked = await checkBlockedStatus(senderId, receiverId, prisma);

  if (isBlocked) {
    throw new AppError(403, "BLOCKED_USER");
  }

  // ==========================================
  // 4. MATCH VALIDATION
  // ==========================================

  const isMatched = await checkMatch(senderId, receiverId, prisma);

  // Same behavior as sendEngagementService.
  // If matched users should be able to send
  // gifts in chat, remove this validation.

  if (isMatched) {
    throw new AppError(400, "ALREADY_MATCHED");
  }

  // ==========================================
  // 5. RECEIVER VALIDATION
  // ==========================================

  const receiver = await prisma.user.findUnique({
    where: {
      id: receiverId,
    },
    select: {
      id: true,
      full_name: true,
      deleted_at: true,
    },
  });

  if (!receiver || receiver.deleted_at) {
    throw new AppError(404, "RECEIVER_NOT_FOUND");
  }

  // ==========================================
  // CONVERT GIFT ID STRING TO NUMBER
  // ==========================================

  console.log("gift id : ", giftId)
  const parsedGiftId = Number(giftId);

  if (!Number.isSafeInteger(parsedGiftId) || parsedGiftId <= 0) {
    throw new AppError(400, "INVALID_GIFT_ID");
  }
  // ==========================================
  // 6. GIFT VALIDATION
  // ==========================================

  const gift = await prisma.gift.findUnique({
    where: {
      id: parsedGiftId,
    },
  });

  if (!gift) {
    throw new AppError(404, "GIFT_NOT_FOUND");
  }

  // ==========================================
  // 7. TRANSACTION
  // ==========================================

  const result = await prisma.$transaction(
    async (tx) => {
      // --------------------------------------
      // 7.1 REVALIDATE PARTICIPANTS
      // --------------------------------------

      const activeParticipants = await tx.conversationParticipant.findMany({
        where: {
          conversationId,
          userId: {
            in: [senderId, receiverId],
          },
          deletedAt: null,
        },
        select: {
          userId: true,
        },
      });

      if (
        activeParticipants.length !== 2 ||
        !activeParticipants.some((p) => p.userId === senderId) ||
        !activeParticipants.some((p) => p.userId === receiverId)
      ) {
        throw new AppError(403, "INVALID_CONVERSATION_PARTICIPANTS");
      }

      // --------------------------------------
      // 7.2 COUNT PREVIOUS GIFTS
      // --------------------------------------

      const previousGiftCount = await tx.userGift.count({
        where: {
          senderId,
          receiverId,
        },
      });

      // First gift: 25 messages
      // Second gift: 5 messages
      // Third and subsequent: 1 message

      const requiredMessages =
        previousGiftCount === 0 ? 25 : previousGiftCount === 1 ? 5 : 1;

      // --------------------------------------
      // 7.3 FIND LAST GIFT
      // --------------------------------------

      const lastGift = await tx.userGift.findFirst({
        where: {
          senderId,
          receiverId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          createdAt: true,
        },
      });

      // --------------------------------------
      // 7.4 COUNT ELIGIBLE CHAT MESSAGES
      // --------------------------------------

      const sentMessageCount = await tx.chatMessage.count({
        where: {
          conversationId,
          senderId,
          deletedAt: null,
          messageType: {
            in: GIFT_UNLOCK_MESSAGE_TYPES,
          },

          ...(lastGift
            ? {
                createdAt: {
                  gt: lastGift.createdAt,
                },
              }
            : {}),
        },
      });

    //   if (sentMessageCount < requiredMessages) {
    //     throw new AppError(
    //       400,
    //       `GIFT_LOCKED: ${
    //         requiredMessages - sentMessageCount
    //       } more messages required`,
    //     );
    //   }

      // --------------------------------------
      // 7.5 CREATE GIFT AND DEDUCT WALLET
      // --------------------------------------

      // This helper must:
      // - Validate gift availability
      // - Read authoritative gift price
      // - Check wallet balance
      // - Deduct wallet balance atomically
      // - Create wallet transaction
      // - Create UserGift record
      //
      // It must NOT create another chatMessage.

      const giftResult = await createBundleGift(
        senderId,
        receiverId,
        { giftId: parsedGiftId, message: content?.trim() || undefined },
        targetType,
        targetId,
        tx,
      );

      // --------------------------------------
      // 7.6 CREATE CHAT MESSAGE
      // --------------------------------------

      const message = await tx.chatMessage.create({
        data: {
          conversationId,
          senderId,

          messageType: MessageType.GIFT,

          // Purchased UserGift ID
          giftId: giftResult.userGift.id,

          // Original socket content
          content: content?.trim() || null,

          // Gift image from backend
          mediaUrl: giftResult.mediaUrl,

          metadata: {
            isBundle: false,

            // Purchased gift ID
            giftId: giftResult.userGift.id,

            // Original catalog gift ID
            catalogGiftId: giftId,

            giftName: giftResult.userGift.giftName,

            targetType,
            targetId,

            matched: false,
          },
        },
      });

      // --------------------------------------
      // 7.7 UPDATE CONVERSATION
      // --------------------------------------

      await tx.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      // --------------------------------------
      // 7.8 FINAL WALLET BALANCE
      // --------------------------------------

      const wallet = await tx.wallet.findUnique({
        where: {
          userId: senderId,
        },
        select: {
          balance: true,
        },
      });

      return {
        message,

        gift: {
          id: giftResult.userGift.id,
          name: giftResult.userGift.giftName,
          pricePaid: giftResult.userGift.pricePaid.toString(),
          mediaUrl: giftResult.mediaUrl,
        },

        payment: {
          method: "WALLET" as const,
          amount: Number(giftResult.userGift.pricePaid),
          walletBalance: wallet?.balance.toString() ?? null,
        },
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );

  // ==========================================
  // 8. NOTIFICATION AFTER TRANSACTION
  // ==========================================

  try {
    const sender = await prisma.user.findUnique({
      where: {
        id: senderId,
      },
      select: {
        full_name: true,
      },
    });

    const senderName = sender?.full_name?.trim() || "Someone";

    const receiverViewingChat = await isUserViewingConversation(
      receiverId,
      conversationId,
    );

    await createNotification({
      senderId,
      receiverId,

      type: "NEW_GIFT",

      title: "You received a gift 🎁",

      message: `${senderName} sent you ` + `${result.gift.name} 🎁`,

      data: {
        type: "GIFT",

        giftId: result.gift.id,

        giftName: result.gift.name,

        conversationId,

        messageId: result.message.id,

        senderId,
        receiverId,

        targetType,
        targetId,
      },

      skipPush: receiverViewingChat,
    });
  } catch (error) {
    // Notification failure must not
    // roll back the committed gift.

    console.error("GIFT_NOTIFICATION_ERROR:", error);
  }

  // ==========================================
  // 9. RETURN RESULT
  // ==========================================

  return {
    success: true,
    message: "Gift sent successfully",

    data: result,
  };
};
