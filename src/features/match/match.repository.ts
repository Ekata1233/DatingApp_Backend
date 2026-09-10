import { prisma } from "../../prisma/prismaClient";
import { normalizeUserPair } from "./match.helper";

export const matchRepository = {

  /**
   * Find active match between two users
   */
  async findActiveMatch(
    currentUserId: string,
    otherUserId: string
  ) {
    return prisma.userMatch.findFirst({
      where: {
        is_active: true,
        is_deleted: false,

        OR: [
          {
            user1Id: currentUserId,
            user2Id: otherUserId,
          },
          {
            user1Id: otherUserId,
            user2Id: currentUserId,
          },
        ],
      },
    });
  },


  /**
   * Unmatch users
   */
  async unmatch(
    matchId: string,
    currentUserId: string,
    reason: string,
    note?: string
  ) {

    return prisma.$transaction(async (tx) => {

      /**
       * ----------------------------------------
       * 1. Update match
       * ----------------------------------------
       */

      const match = await tx.userMatch.update({
        where: {
          id: matchId,
        },

        data: {
          is_active: false,
          is_deleted: true,

          unmatched_at: new Date(),
          unmatched_by: currentUserId,

          unmatch_reason: reason,
          unmatch_note: note || null,
        },
      });

      /**
       * ----------------------------------------
       * 2. Find conversation
       * ----------------------------------------
       */

      const conversation = await tx.conversation.findFirst({
        where: {
          AND: [
            {
              participants: {
                some: {
                  userId: match.user1Id,
                },
              },
            },
            {
              participants: {
                some: {
                  userId: match.user2Id,
                },
              },
            },
          ],
        },

        select: {
          id: true,
        },
      });

      /**
       * ----------------------------------------
       * 3. Delete chat
       * ----------------------------------------
       */

      if (conversation) {

        await tx.chatMessage.deleteMany({
          where: {
            conversationId: conversation.id,
          },
        });

        await tx.conversationParticipant.deleteMany({
          where: {
            conversationId: conversation.id,
          },
        });

        await tx.conversation.delete({
          where: {
            id: conversation.id,
          },
        });
      }

      return {
        match,
        conversationId: conversation?.id ?? null,
      };
    });
  },
};

export const findMatchBetweenUsersRepository = async (
  userAId: string,
  userBId: string,
) => {
  const { user1Id, user2Id } =
    normalizeUserPair(userAId, userBId);

  return prisma.userMatch.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
  });
};

export const createMatchRepository = async (
  userAId: string,
  userBId: string,
) => {
  const { user1Id, user2Id } =
    normalizeUserPair(userAId, userBId);

  return prisma.userMatch.upsert({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },

    update: {
      is_active: true,
      is_deleted: false,
      unmatched_at: null,
      unmatched_by: null,
      unmatch_reason: null,
      unmatch_note: null,
    },

    create: {
      user1Id,
      user2Id,
      is_active: true,
      is_deleted: false,
    },
  });
};

export const findMatchTriggerMessageRepository = async (
  conversationId: string,
  replyingUserId: string,
) => {
  return prisma.chatMessage.findFirst({
    where: {
      conversationId,

      // Original interaction must have been
      // sent by somebody else
      senderId: {
        not: replyingUserId,
      },

      deletedAt: null,

      OR: [
        {
          roseId: {
            not: null,
          },
          rose: {
            receiverId: replyingUserId,
          },
        },

        {
          complimentId: {
            not: null,
          },
          compliment: {
            receiverId: replyingUserId,
          },
        },

        {
          giftId: {
            not: null,
          },
          gift: {
            receiverId: replyingUserId,
          },
        },
      ],
    },

    select: {
      id: true,
      senderId: true,
      messageType: true,
      roseId: true,
      complimentId: true,
      giftId: true,

      rose: {
        select: {
          senderId: true,
          receiverId: true,
        },
      },

      compliment: {
        select: {
          senderId: true,
          receiverId: true,
        },
      },

      gift: {
        select: {
          senderId: true,
          receiverId: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findConversationMatchState = async (
  conversationId: string,
) => {
  return prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
    select: {
      id: true,
      match: true,
      matchPendingForUserId: true,
    },
  });
};

export const markConversationMatched = async (
  conversationId: string,
) => {
  return prisma.conversation.update({
    where: {
      id: conversationId,
    },
    data: {
      match: true,
      matchPendingForUserId: null,
    },
  });
};

/**
 * Set receiver as the user whose reply
 * can create the match.
 */
export const setConversationMatchPendingRepository =
  async (
    conversationId: string,
    receiverId: string,
  ) => {
    return prisma.conversation.updateMany({
      where: {
        id: conversationId,

        // Don't reset matched conversations.
        match: false,
      },

      data: {
        matchPendingForUserId:
          receiverId,
      },
    });
  };