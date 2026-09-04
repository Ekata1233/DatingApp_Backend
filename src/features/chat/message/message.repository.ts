// src/modules/chat/message/message.repository.ts

import { MessageType, Prisma } from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

export const messageRepository = {
  /**
   * Find conversation participant.
   *
   * Used to make sure the user belongs
   * to the conversation.
   */
  async findConversationParticipant(
    conversationId: string,
    userId: string
  ) {
    return prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
  },

  /**
   * Find message by ID.
   */
  async findById(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },

      include: {
        conversation: {
          select: {
            id: true,
          },
        },
      },
    });
  },

  /**
   * Create message.
   */
  async create(data: {
    conversationId: string;
    senderId: string;
    content?: string | null;
    messageType: MessageType;
    mediaUrl?: string | null;
    metadata?: Prisma.InputJsonValue | null;
  }) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content ?? null,
          messageType: data.messageType,
          mediaUrl: data.mediaUrl ?? null,
          metadata: data.metadata ?? undefined,
        },
      });

      console.log("message created in message repo : ", message);

      await tx.conversation.update({
        where: {
          id: data.conversationId,
        },

        data: {
          updatedAt: new Date(),
        },
      });

      return message;
    });
  },

  /**
   * Get messages of a conversation.
   *
   * Cursor pagination is used instead of
   * offset pagination.
   */
  async findMany(
    conversationId: string,
    cursor?: string,
    limit = 30
  ) {
    return prisma.chatMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: limit + 1,

      ...(cursor
        ? {
          skip: 1,

          cursor: {
            id: cursor,
          },
        }
        : {}),

      // include: {
      //   replyToMessage: {
      //     select: {
      //       id: true,
      //       senderId: true,
      //       content: true,
      //       messageType: true,
      //       createdAt: true,
      //     },
      //   },
      // },
    });
  },

  /**
   * Mark a single message as delivered.
   */
  async markDelivered(messageId: string) {
    return prisma.chatMessage.update({
      where: {
        id: messageId,
      },

      data: {
        deliveredAt: new Date(),
      },
    });
  },

  /**
   * Mark a single message as read.
   */
  async markRead(messageId: string) {
    return prisma.chatMessage.update({
      where: {
        id: messageId,
      },

      data: {
        readAt: new Date(),
      },
    });
  },

  /**
   * Mark all unread messages in conversation
   * as read for the current receiver.
   */
  async markConversationMessagesRead(
    conversationId: string,
    userId: string
  ) {
    return prisma.$transaction(async (tx) => {
      const readAt = new Date();

      // 1. Mark all received messages as read
      const messages =
        await tx.chatMessage.updateMany({
          where: {
            conversationId,

            senderId: {
              not: userId,
            },

            readAt: null,

            deletedAt: null,
          },

          data: {
            readAt,
          },
        });

      // 2. Update user's conversation read position
      await tx.conversationParticipant.update({
        where: {
          conversationId_userId: {
            conversationId,
            userId,
          },
        },

        data: {
          lastReadAt: readAt,
        },
      });

      return {
        count: messages.count,
        conversationId,
        userId,
        readAt,
      };
    });
  },

  /**
   * Soft delete message.
   */
  async softDelete(messageId: string) {
    return prisma.chatMessage.update({
      where: {
        id: messageId,
      },

      data: {
        deletedAt: new Date(),

        /**
         * Optional:
         * Replace message content after deletion.
         */
        content: null,

        mediaUrl: null,
      },
    });
  },

  /**
   * Check whether reply message exists
   * in the same conversation.
   */
  async findReplyMessage(
    messageId: string,
    conversationId: string
  ) {
    return prisma.chatMessage.findFirst({
      where: {
        id: messageId,
        conversationId,
        deletedAt: null,
      },

      select: {
        id: true,
        senderId: true,
        content: true,
        messageType: true,
        createdAt: true,
      },
    });
  },

  async findOtherParticipant(
  conversationId: string,
  userId: string
) {
  return prisma.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: {
        not: userId,
      },
    },
    select: {
      userId: true,
    },
  });
}
};