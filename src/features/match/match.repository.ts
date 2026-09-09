import { prisma } from "../../prisma/prismaClient";

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