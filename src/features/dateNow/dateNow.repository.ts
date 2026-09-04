import { prisma } from "../../prisma/prismaClient";

export const dateNowInviteMessageRepo = {
async findDatePlanById(
  datePlanId: string,
) {
  return prisma.datePlan.findUnique({
    where: {
      id: datePlanId,
    },

    include: {
      user: true,

      activity: true,

      quickTitle: true,

      whoPays: true,

      joinRequestGender: true,

      visibility: true,

      vibes: true,

      _count: {
        select: {
          requests: true,
        },
      },
    },
  });
},

async createDateInviteMessage(
  conversationId: string,
  senderId: string,
  datePlanId: string,
) {
  return prisma.chatMessage.create({
    data: {
      conversationId,
      senderId,

      messageType: "DATE_INVITE",

      datePlanId,

      metadata: {
        status: "PENDING",
      },
    },

    include: {
      sender: true,

      datePlan: {
        include: {
          user: true,

          activity: true,

          quickTitle: true,

          whoPays: true,

          joinRequestGender: true,

          visibility: true,

          vibes: true,

          _count: {
            select: {
              requests: true,
            },
          },
        },
      },
    },
  });
},
}