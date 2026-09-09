
import { prisma } from "../../../prisma/prismaClient";
import {
  getSharedItemsRepository,
  SharedItemType,
} from "./sharedItem.repository";

interface GetSharedItemsParams {
  userId: string;
  conversationId: string;
  type: SharedItemType;
  page?: number;
  limit?: number;
}

export const getSharedItemsService = async ({
  userId,
  conversationId,
  type,
  page = 1,
  limit = 20,
}: GetSharedItemsParams) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  const validTypes: SharedItemType[] = [
    "MEDIA",
    "DOCUMENTS",
    "LINKS",
  ];

  if (!validTypes.includes(type)) {
    throw new Error(
      "Invalid type. Allowed types: MEDIA, DOCUMENTS, LINKS",
    );
  }

  /*
   * Very important:
   * Make sure logged-in user actually belongs
   * to this conversation.
   */

  const participant =
    await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId,
      },
      select: {
        id: true,
      },
    });

  if (!participant) {
    throw new Error(
      "You are not allowed to access this conversation",
    );
  }

  const safePage = Math.max(Number(page) || 1, 1);

  const safeLimit = Math.min(
    Math.max(Number(limit) || 20, 1),
    100,
  );

  const { messages, total } =
    await getSharedItemsRepository({
      conversationId,
      type,
      page: safePage,
      limit: safeLimit,
    });

  const data = messages.map((message) => {
    const senderPhoto =
      message.sender.photos?.[0]?.media_url ?? null;

    return {
      id: message.id,

      messageType: message.messageType,

      sender: {
        id: message.sender.id,
        name: message.sender.full_name,
        photo: senderPhoto,
        isMe: message.senderId === userId,
      },

      /*
       * IMAGE / VIDEO / AUDIO / FILE
       */
      mediaUrl: message.mediaUrl,

      /*
       * LINK URL or optional file caption/message
       */
      content: message.content,

      metadata: message.metadata,

      createdAt: message.createdAt,
    };
  });

  return {
    type,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage:
        safePage * safeLimit < total,
    },

    data,
  };
};