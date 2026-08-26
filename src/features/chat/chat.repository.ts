// src/modules/chat/chat.repository.ts

import { MessageType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { ConversationFilter } from "./chat.types";
import { presenceService } from "./presence/presence.service";

export const calculateAge = (birthDate: Date | null): number | null => {
  if (!birthDate) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

export const chatRepository = {
  /**
   * Find conversation between two users.
   */
  async findConversationBetweenUsers(userId: string, targetUserId: string) {
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
  async createConversation(userId: string, targetUserId: string) {
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
  async findParticipant(conversationId: string, userId: string) {
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
  // async findUserConversations(
  //   userId: string,
  //   cursor?: string,
  //   limit = 20,
  //   type: ConversationFilter = "all",
  // ) {
  //   const conversations = await prisma.conversation.findMany({
  //     where: {
  //       participants: {
  //         some: {
  //           userId,
  //         },
  //       },
  //     },

  //     orderBy: {
  //       updatedAt: "desc",
  //     },

  //     take: limit + 1,

  //     ...(cursor
  //       ? {
  //         skip: 1,
  //         cursor: {
  //           id: cursor,
  //         },
  //       }
  //       : {}),

  //     include: {
  //       participants: {
  //         where: {
  //           deletedAt: null,
  //         },

  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               full_name: true,
  //               birth_date: true,

  //               photos: {
  //                 where: {
  //                   is_primary: true,
  //                 },

  //                 take: 1,

  //                 select: {
  //                   id: true,
  //                   media_url: true,
  //                   media_type: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //       },

  //       messages: {
  //         orderBy: {
  //           createdAt: "desc",
  //         },

  //         take: 1,

  //         select: {
  //           id: true,
  //           senderId: true,
  //           content: true,
  //           messageType: true,
  //           mediaUrl: true,
  //           createdAt: true,
  //           deliveredAt: true,
  //           readAt: true,
  //         },
  //       },
  //     },
  //   });

  //   // --------------------------------------------------
  //   // Get all other users from conversations
  //   // --------------------------------------------------

  //   const candidateIds = conversations
  //     .map((conversation) => {
  //       const otherParticipant = conversation.participants.find(
  //         (participant) => participant.userId !== userId,
  //       );

  //       return otherParticipant?.userId;
  //     })
  //     .filter((id): id is string => Boolean(id));

  //   // --------------------------------------------------
  //   // Get match scores
  //   // --------------------------------------------------

  //   const matchScores = await prisma.userCompatibility.findMany({
  //     where: {
  //       userId,

  //       targetUserId: {
  //         in: candidateIds,
  //       },
  //     },

  //     select: {
  //       targetUserId: true,
  //       score: true,
  //       percentage: true,
  //     },
  //   });

  //   // --------------------------------------------------
  //   // Convert match scores into Map
  //   // --------------------------------------------------

  //   const matchScoreMap = new Map(
  //     matchScores.map((item) => [
  //       item.targetUserId,
  //       {
  //         score: item.score,
  //         percentage: item.percentage,
  //       },
  //     ]),
  //   );

  //   // --------------------------------------------------
  //   // Convert DB result into chat-list response
  //   // --------------------------------------------------

  //   const result = await Promise.all(
  //     conversations.map(async (conversation) => {
  //       const currentParticipant =
  //         conversation.participants.find(
  //           (participant) =>
  //             participant.userId === userId,
  //         );

  //       const otherParticipant =
  //         conversation.participants.find(
  //           (participant) =>
  //             participant.userId !== userId,
  //         );

  //       if (!currentParticipant || !otherParticipant) {
  //         return null;
  //       }

  //       // --------------------------------------------------
  //       // Unread messages
  //       // --------------------------------------------------

  //       const unreadCount =
  //         await prisma.chatMessage.count({
  //           where: {
  //             conversationId: conversation.id,

  //             senderId: {
  //               not: userId,
  //             },

  //             readAt: null,

  //             ...(currentParticipant.lastReadAt
  //               ? {
  //                 createdAt: {
  //                   gt: currentParticipant.lastReadAt,
  //                 },
  //               }
  //               : {}),
  //           },
  //         });

  //       const otherUser =
  //         otherParticipant.user;

  //       const compatibility =
  //         matchScoreMap.get(otherUser.id);

  //       return {
  //         conversationId: conversation.id,

  //         user: {
  //           id: otherUser.id,
  //           fullName: otherUser.full_name,

  //           age: calculateAge(
  //             otherUser.birth_date,
  //           ),

  //           profilePhoto:
  //             otherUser.photos[0]?.media_url ??
  //             null,

  //           matchPercentage:
  //             compatibility?.percentage ?? 0,

  //           trustPercentage: 85,

  //           isOnline: true,
  //         },

  //         lastMessage:
  //           conversation.messages[0] ?? null,

  //         unreadCount,

  //         updatedAt: conversation.updatedAt,
  //       };
  //     }),
  //   );

  //   return result.filter(Boolean);
  // },


  async findUserConversations(
    userId: string,
    cursor?: string,
    limit = 20,
    type: ConversationFilter = "all",
  ) {
    // --------------------------------------------------
    // 1. Get current user's location
    // --------------------------------------------------

    let nearbyUserIds: string[] = [];

    if (type === "nearby") {
      const currentUserProfile =
        await prisma.userProfile.findUnique({
          where: {
            user_id: userId,
          },
          select: {
            latitude: true,
            longitude: true,
          },
        });

      if (
        currentUserProfile?.latitude == null ||
        currentUserProfile?.longitude == null
      ) {
        return [];
      }

      // 10 KM radius
      const nearbyUsers = await prisma.$queryRaw<
        { user_id: string }[]
      >`
      SELECT up.user_id
      FROM user_profiles up
      WHERE
        up.user_id <> ${userId}::uuid
        AND up.location IS NOT NULL
        AND ST_DWithin(
          up.location,
          ST_SetSRID(
            ST_MakePoint(
              ${Number(currentUserProfile.longitude)},
              ${Number(currentUserProfile.latitude)}
            ),
            4326
          )::geography,
          25000
        )
    `;

      nearbyUserIds = nearbyUsers.map(
        (user) => user.user_id,
      );

      if (nearbyUserIds.length === 0) {
        return [];
      }
    }

    // --------------------------------------------------
    // 2. Build conversation WHERE condition
    // --------------------------------------------------

    const where: Prisma.ConversationWhereInput = {
      participants: {
        some: {
          userId,
          deletedAt: null,
        },
      },
    };

    // --------------------------------------------------
    // 3. Nearby filter
    // --------------------------------------------------

    if (type === "nearby") {
      where.participants = {
        some: {
          userId: {
            in: nearbyUserIds,
          },
          deletedAt: null,
        },
      };
    }

    // --------------------------------------------------
    // 4. Date Invite filter
    // --------------------------------------------------

    if (type === "date_invite") {
      where.messages = {
        some: {
          messageType: MessageType.DATE_CONFIRMED,
          deletedAt: null,
        },
      };
    }

    // --------------------------------------------------
    // 5. Gift filter
    // --------------------------------------------------

    if (type === "gift") {
      where.messages = {
        some: {
          messageType: MessageType.GIFT,
          deletedAt: null,
        },
      };
    }

    // --------------------------------------------------
    // 6. Unread filter
    // --------------------------------------------------

    if (type === "unread") {
      where.messages = {
        some: {
          senderId: {
            not: userId,
          },
          readAt: null,
          deletedAt: null,
        },
      };
    }

    // --------------------------------------------------
    // 7. Get conversations
    // --------------------------------------------------

    const conversations =
      await prisma.conversation.findMany({
        where,

        orderBy: {
          updatedAt: "desc",
        },

        // IMPORTANT:
        // Service will handle pagination.
        // Repository returns limit + 1.
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
          // --------------------------------------------------
          // Participants
          // --------------------------------------------------

          participants: {
            where: {
              deletedAt: null,
            },

            include: {
              user: {
                select: {
                  id: true,
                  full_name: true,
                  birth_date: true,

                  photos: {
                    where: {
                      is_primary: true,
                    },

                    take: 1,

                    select: {
                      id: true,
                      media_url: true,
                      media_type: true,
                    },
                  },
                },
              },
            },
          },

          // --------------------------------------------------
          // Latest message
          // --------------------------------------------------

          messages: {
            where: {
              deletedAt: null,
            },

            orderBy: {
              createdAt: "desc",
            },

            take: 1,

            select: {
              id: true,
              senderId: true,
              content: true,
              messageType: true,
              mediaUrl: true,
              createdAt: true,
              deliveredAt: true,
              readAt: true,
            },
          },
        },
      });

    // --------------------------------------------------
    // 8. Get other participant IDs
    // --------------------------------------------------

    const candidateIds = conversations
      .map((conversation) => {
        const otherParticipant =
          conversation.participants.find(
            (participant) =>
              participant.userId !== userId,
          );

        return otherParticipant?.userId;
      })
      .filter(
        (id): id is string => Boolean(id),
      );

    // --------------------------------------------------
    // 8.1 Get presence from Redis
    // --------------------------------------------------

    const userPresence =
      candidateIds.length > 0
        ? await presenceService.getUsersPresence({
          userIds: candidateIds,
        })
        : [];

    // --------------------------------------------------
    // 8.2 Convert presence into Map
    // --------------------------------------------------

    const presenceMap = new Map(
      userPresence.map((item) => [
        item.userId,
        {
          isOnline: item.isOnline,
          lastSeenAt: item.lastSeenAt,
        },
      ]),
    );
    // --------------------------------------------------
    // 9. Get compatibility scores
    // --------------------------------------------------

    const matchScores =
      candidateIds.length > 0
        ? await prisma.userCompatibility.findMany({
          where: {
            userId,

            targetUserId: {
              in: candidateIds,
            },
          },

          select: {
            targetUserId: true,
            score: true,
            percentage: true,
          },
        })
        : [];

    // --------------------------------------------------
    // 10. Convert scores into Map
    // --------------------------------------------------

    const matchScoreMap = new Map(
      matchScores.map((item) => [
        item.targetUserId,
        {
          score: item.score,
          percentage: item.percentage,
        },
      ]),
    );

    // --------------------------------------------------
    // 11. Convert conversations
    // --------------------------------------------------

    const result = await Promise.all(
      conversations.map(
        async (conversation) => {
          const currentParticipant =
            conversation.participants.find(
              (participant) =>
                participant.userId === userId,
            );

          const otherParticipant =
            conversation.participants.find(
              (participant) =>
                participant.userId !== userId,
            );

          if (
            !currentParticipant ||
            !otherParticipant
          ) {
            return null;
          }

          // --------------------------------------------------
          // 12. Unread count
          // --------------------------------------------------

          const unreadCount =
            await prisma.chatMessage.count({
              where: {
                conversationId:
                  conversation.id,

                senderId: {
                  not: userId,
                },

                readAt: null,

                deletedAt: null,

                ...(currentParticipant.lastReadAt
                  ? {
                    createdAt: {
                      gt: currentParticipant.lastReadAt,
                    },
                  }
                  : {}),
              },
            });

          // --------------------------------------------------
          // 13. Other user
          // --------------------------------------------------

          const otherUser =
            otherParticipant.user;

          const compatibility =
            matchScoreMap.get(
              otherUser.id,
            );

          // --------------------------------------------------
          // 14. Final response
          // --------------------------------------------------

          const presence =
            presenceMap.get(otherUser.id);

          return {
            conversationId:
              conversation.id,

            user: {
              id: otherUser.id,

              fullName:
                otherUser.full_name,

              age: calculateAge(
                otherUser.birth_date,
              ),

              profilePhoto:
                otherUser.photos[0]
                  ?.media_url ?? null,

              matchPercentage:
                compatibility?.percentage ??
                0,

              trustPercentage: 85,

              isOnline:
                presence?.isOnline ?? false,

              lastSeenAt:
                presence?.lastSeenAt ?? null,
            },

            lastMessage: (() => {
              const message = conversation.messages[0];

              if (!message) {
                return null;
              }

              let displayContent = message.content;

              if (message.messageType === "IMAGE") {
                displayContent = message.content
                  ? `📷 ${message.content}`
                  : "📷Photo";
              } else if (message.messageType === "VIDEO") {
                displayContent = message.content
                  ? `🎥 ${message.content}`
                  : "🎥Video";
              }

              return {
                ...message,
                content: displayContent,
              };
            })(),

            unreadCount,

            updatedAt:
              conversation.updatedAt,
          };
        },
      ),
    );

    // --------------------------------------------------
    // 15. Return plain array
    // --------------------------------------------------

    return result.filter(
      (item): item is NonNullable<typeof item> =>
        item !== null,
    );
  },
  /**
   * Get messages using cursor pagination.
   */
  async findMessages(conversationId: string, userId: string, cursor?: string, limit = 30) {
    return prisma.chatMessage.findMany({
      where: {
        conversationId,
        deletedAt: null,
        // Clear chat deletion for this user
        deletions: {
          none: {
            userId,
          },
        },
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
        mediaUrl: true,
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
    messageType: MessageType;
    mediaUrl?: string;
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
  async markConversationRead(conversationId: string, userId: string) {
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
  async markMessagesDelivered(conversationId: string, receiverId: string) {
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
  async markMessagesRead(conversationId: string, userId: string) {
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

  async findOtherParticipant(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findFirst({
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

    if (!participant) {
      throw new Error("Other participant not found");
    }

    return participant.userId;
  },

  async hasPreviousMessages(conversationId: string) {
    const count = await prisma.chatMessage.count({
      where: {
        conversationId,
      },
    });

    return count > 0;
  },

  async findOtherParticipantDetails(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId,
        userId: {
          not: userId,
        },
      },
      select: {
        userId: true,

        user: {
          select: {
            id: true,
            full_name: true,
            birth_date: true,

            photos: {
              where: {
                is_primary: true,
              },
              select: {
                media_url: true,
              },
              take: 1,
            },
          },
        },
      },
    });

    if (!participant) {
      throw new Error("Other participant not found");
    }

    return {
      ...participant.user,
      age: calculateAge(participant.user.birth_date),
    };
  },

  async getUnreadCount(conversationId: string, userId: string) {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      select: {
        lastReadAt: true,
      },
    });

    if (!participant) {
      throw new Error("Conversation participant not found");
    }

    const unreadCount = await prisma.chatMessage.count({
      where: {
        conversationId,

        // Don't count your own messages
        senderId: {
          not: userId,
        },

        readAt: null,
        // Messages after the user's last read time
        ...(participant.lastReadAt
          ? {
            createdAt: {
              gt: participant.lastReadAt,
            },
          }
          : {}),
      },
    });

    return unreadCount;
  },

  async findConversationParticipants(conversationId: string, userId: string) {
    return prisma.conversationParticipant.findMany({
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
  },

  async findParticipants(conversationId: string) {
    return prisma.conversationParticipant.findMany({
      where: {
        conversationId,
      },
      select: {
        userId: true,
      },
    });
  },

  async getUserDetails(userId: string) {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        full_name: true,
        birth_date: true,

        photos: {
          where: {
            is_primary: true,
          },

          take: 1,

          select: {
            id: true,
            media_url: true,
            media_type: true,
          },
        },
      },
    });
  },

  //DELETE CONVERSATION 
  async deleteConversationForUser(
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
        deletedAt: new Date(),
      },
    });
  },

  //CLEAR ALL CHAT
  async clearChat(
    conversationId: string,
    userId: string
  ) {
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      select: {
        id: true,
      },
    });

    if (messages.length === 0) {
      return 0;
    }

    await prisma.chatMessageDeletion.createMany({
      data: messages.map((message) => ({
        messageId: message.id,
        userId,
      })),
      skipDuplicates: true,
    });

    return messages.length;
  },

};
