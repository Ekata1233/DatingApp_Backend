import { Server } from "socket.io";
import { prisma } from "../../../prisma/prismaClient";

type RewardResult = {
  rose: {
    id: string;
    messagesSent: number;
    requiredMessages: number;
    isUnlocked: boolean;
    expiresAt: Date | null;
  } | null;

  gift: {
    id: string;
    messagesSent: number;
    requiredMessages: number;
    isUnlocked: boolean;
    expiresAt: Date;
    giftName: string;
  } | null;

  redeemed: string[];
};

export const emitEngagementProgress = async (
  io: Server,
  conversationId: string,
  result: RewardResult,
) => {
  const updates: any[] = [];

  // ==========================================
  // ROSE PROGRESS
  // ==========================================

  if (result.rose) {
    const rose = result.rose;

    const chatMessage = await prisma.chatMessage.findFirst({
      where: {
        roseId: rose.id,
        conversationId,
      },
      select: {
        id: true,
      },
    });

    if (chatMessage) {
      const percentage = Math.min(
        100,
        Math.round(
          (rose.messagesSent /
            Math.max(rose.requiredMessages, 1)) *
            100,
        ),
      );

      updates.push({
        conversationId,
        messageId: chatMessage.id,
        engagementId: rose.id,
        progress: {
          current: rose.messagesSent,
          target: rose.requiredMessages,
          percentage,
          label: `${rose.messagesSent}/${rose.requiredMessages} for Rose`,
          type: "ROSE",
          expiresAt: rose.expiresAt,
        },
        isUnlocked: rose.isUnlocked,
      });
    }
  }

  // ==========================================
  // GIFT PROGRESS
  // ==========================================

  if (result.gift) {
    const gift = result.gift;

    const chatMessage = await prisma.chatMessage.findFirst({
      where: {
        giftId: gift.id,
        conversationId,
      },
      select: {
        id: true,
      },
    });

    if (chatMessage) {
      const percentage = Math.min(
        100,
        Math.round(
          (gift.messagesSent /
            Math.max(gift.requiredMessages, 1)) *
            100,
        ),
      );

      updates.push({
        conversationId,
        messageId: chatMessage.id,
        engagementId: gift.id,
        progress: {
          current: gift.messagesSent,
          target: gift.requiredMessages,
          percentage,
          label: `${gift.messagesSent}/${gift.requiredMessages} for ${gift.giftName}`,
          type: "GIFT",
          giftName: gift.giftName,
          expiresAt: gift.expiresAt,
        },
        isUnlocked: gift.isUnlocked,
      });
    }
  }

  // ==========================================
  // SEND TO BOTH USERS
  // ==========================================

  for (const update of updates) {
    io.to(`conversation:${conversationId}`).emit(
      "engagement:progress:update",
      update,
    );
  }

  return updates;
};