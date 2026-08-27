import { MessageType, Prisma } from "@prisma/client";

interface CreateGiftMessageData {
  conversationId: string;
  senderId: string;
  giftId: number;
  coinCost: number;
  targetType: string | null;
  targetId: string | null;
  requiredMessages: number;
  mediaUrl: string | null;
  expiresAt: Date | null;
}

export const createGiftChatMessage = async (
  data: CreateGiftMessageData,
  tx: Prisma.TransactionClient
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: null,
      messageType: MessageType.GIFT,
      mediaUrl: data.mediaUrl,
      metadata: {
        giftId: data.giftId,
        coinCost: data.coinCost,
        targetType: data.targetType,
        targetId: data.targetId,
        requiredMessages: data.requiredMessages,
        messagesSent: 0,
        isUnlocked: false,
        expiresAt: data.expiresAt?.toISOString() ?? null,
      },
    },
  });
};