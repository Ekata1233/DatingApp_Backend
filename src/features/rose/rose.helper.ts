import { MessageType, Prisma, TargetType } from "@prisma/client";

interface CreateRoseMessageData {
  conversationId: string;
  senderId: string;
  roseId: string;
  targetType?: TargetType | null;
  targetId?: string | null;
}

export const createRoseChatMessage = async (
  data: CreateRoseMessageData,
  tx: Prisma.TransactionClient
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: null,
      messageType: MessageType.ROSE,
      roseId: data.roseId,
      metadata: {
        targetType: data.targetType,
        targetId: data.targetId,
      },
    },
  });
};