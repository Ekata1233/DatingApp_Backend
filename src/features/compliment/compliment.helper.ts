import { MessageType, Prisma, TargetType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

interface CreateComplimentMessageData {
  conversationId: string;
  senderId: string;
  complimentId: string;
  targetType?: TargetType | null;
  targetId?: string | null;
  content: string;
}

export const createComplimentChatMessage = async (
  data: CreateComplimentMessageData,
  tx: Prisma.TransactionClient = prisma
) => {
  return tx.chatMessage.create({
    data: {
      conversationId: data.conversationId,
      senderId: data.senderId,

      content: data.content,

      messageType: MessageType.COMPLIMENT,

      metadata: {
        complimentId: data.complimentId,
        targetType: data.targetType ?? null,
        targetId: data.targetId ?? null,
      },
    },
  });
};