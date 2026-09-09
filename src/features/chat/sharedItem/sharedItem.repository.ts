import { MessageType, Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";


export type SharedItemType = "MEDIA" | "DOCUMENTS" | "LINKS";

interface GetSharedItemsParams {
  conversationId: string;
  type: SharedItemType;
  page: number;
  limit: number;
}

const getMessageTypes = (
  type: SharedItemType,
): MessageType[] => {
  switch (type) {
    case "MEDIA":
      return [
        MessageType.IMAGE,
        MessageType.VIDEO,
        MessageType.AUDIO,
      ];

    case "DOCUMENTS":
      return [MessageType.FILE];

    // case "LINKS":
    //   return [MessageType.LINK];

    default:
      return [];
  }
};

export const getSharedItemsRepository = async ({
  conversationId,
  type,
  page,
  limit,
}: GetSharedItemsParams) => {
  const skip = (page - 1) * limit;

  const messageTypes = getMessageTypes(type);

  const where: Prisma.ChatMessageWhereInput = {
    conversationId,

    messageType: {
      in: messageTypes,
    },

    deletedAt: null,
  };

  const [messages, total] = await Promise.all([
    prisma.chatMessage.findMany({
      where,

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        messageType: true,
        mediaUrl: true,
        metadata: true,
        createdAt: true,

        sender: {
          select: {
            id: true,
            full_name: true,

            photos: {
              select: {
                id: true,
                media_url: true,
              },

              orderBy: {
                order: "asc",
              },

              take: 1,
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      skip,
      take: limit,
    }),

    prisma.chatMessage.count({
      where,
    }),
  ]);

  return {
    messages,
    total,
  };
};