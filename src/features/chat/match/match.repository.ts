import { MessageType } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const matchRepository = {
  async findNewMatches(userId: string) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return prisma.chatMessage.findMany({
      where: {
        senderId: {
          not: userId,
        },

        messageType: {
          in: [MessageType.ROSE, MessageType.GIFT, MessageType.COMPLIMENT],
        },

        readAt: null,

        deletedAt: null,

        createdAt: {
          gte: sevenDaysAgo,
        },

        conversation: {
          participants: {
            some: {
              userId,
            },
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        sender: {
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
  },
};
