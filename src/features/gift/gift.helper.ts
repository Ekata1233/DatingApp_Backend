import { MessageType, Prisma } from "@prisma/client";

interface CreateGiftMessageData {
  conversationId: string;
  senderId: string;
  giftId: string;
  targetType: string | null;
  targetId: string | null;
  mediaUrl: string | null;
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
      giftId: data.giftId,
      metadata: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
  });
};