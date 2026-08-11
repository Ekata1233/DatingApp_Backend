// src/modules/chat/chat.repository.ts

import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const chatRepository = {
  /**
   * Find conversation between two users.
   */
  async findConversationBetweenUsers(
    userId: string,
    targetUserId: string
  ) {
    return prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId,
              },
            },
          },
          {
            participants: {
              some: {
                userId: targetUserId,
              },
            },
          },
        ],
      },

      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            lastReadAt: true,
          },
        },
      },
    });
  },

  /**
   * Create a new conversation.
   */
  async createConversation(
    userId: string,
    targetUserId: string
  ) {
    return prisma.conversation.create({
      data: {
        participants: {
          create: [
            {
              userId,
            },
            {
              userId: targetUserId,
            },
          ],
        },
      },

      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            lastReadAt: true,
          },
        },
      },
    });
  },

  /**
   * Check whether user belongs to conversation.
   */
  async findParticipant(
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
   * Get user's conversations.
   */
  async findUserConversations(
    userId: string,
    cursor?: string,
    limit = 20
  ) {
    return prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
          },
        },
      },

      orderBy: {
        updatedAt: "desc",
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

      include: {
        participants: {
          select: {
            id: true,
            userId: true,
            joinedAt: true,
            lastReadAt: true,
          },
        },

        messages: {
          orderBy: {
            createdAt: "desc",
          },

          take: 1,

          select: {
            id: true,
            senderId: true,
            content: true,
            messageType: true,
            createdAt: true,
            deliveredAt: true,
            readAt: true,
          },
        },
      },
    });
  },

  /**
   * Get messages using cursor pagination.
   */
  async findMessages(
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

      select: {
        id: true,
        conversationId: true,
        senderId: true,
        content: true,
        messageType: true,
        createdAt: true,
        deliveredAt: true,
        readAt: true,
      },
    });
  },

  /**
   * Create a message.
   */
  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content?: string;
    messageType: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO";
    mediaUrl?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content ?? null,
          messageType: data.messageType,
        },
      });

      /**
       * Update conversation's updatedAt.
       *
       * Since updatedAt uses @updatedAt,
       * updating any field will trigger it.
       */
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
   * Mark conversation as read.
   */
  async markConversationRead(
    conversationId: string,
    userId: string
  ) {
    return prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },

      data: {
        lastReadAt: new Date(),
      },
    });
  },

  /**
   * Mark messages as delivered.
   */
  async markMessagesDelivered(
    conversationId: string,
    receiverId: string
  ) {
    return prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: receiverId,
        },
        deliveredAt: null,
        deletedAt: null,
      },

      data: {
        deliveredAt: new Date(),
      },
    });
  },

  /**
   * Mark messages as read.
   */
  async markMessagesRead(
    conversationId: string,
    userId: string
  ) {
    return prisma.chatMessage.updateMany({
      where: {
        conversationId,
        senderId: {
          not: userId,
        },
        readAt: null,
        deletedAt: null,
      },

      data: {
        readAt: new Date(),
      },
    });
  },

  /**
   * Find message.
   */
  async findMessageById(messageId: string) {
    return prisma.chatMessage.findUnique({
      where: {
        id: messageId,
      },
    });
  },

  /**
   * Soft delete message.
   */
  async deleteMessage(messageId: string) {
    return prisma.chatMessage.update({
      where: {
        id: messageId,
      },

      data: {
        deletedAt: new Date(),
      },
    });
  },
};