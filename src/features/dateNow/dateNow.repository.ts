import { AccountStatus, Gender, GenderOption, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const dateNowInviteMessageRepo = {
  async findDatePlanById(datePlanId: string) {
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

  async findDateInviteList(
  userId: string,
  planId: string,
  genderValue: string | null,
) {
  // ============================================
  // 1. BUILD GENDER FILTER
  // ============================================

let genderFilter: Prisma.UserWhereInput = {};

switch (genderValue) {
  case "MEN":
    genderFilter = {
      gender: Gender.MEN,
    };
    break;

  case "WOMEN":
    genderFilter = {
      gender: Gender.WOMEN,
    };
    break;

  case "NON_BINARY":
    genderFilter = {
      gender: Gender.NON_BINARY,
    };
    break;

  // Temporary fallback: includes all men
  case "TRANS_MAN":
    genderFilter = {
      gender: Gender.MEN,
    };
    break;

  // Temporary fallback: includes all women
  case "TRANS_WOMAN":
    genderFilter = {
      gender: Gender.WOMEN,
    };
    break;

  case "OTHER":
    genderFilter = {
      gender: Gender.OTHER,
    };
    break;

  case "PREFER_NOT_TO_SAY":
    genderFilter = {
      gender: Gender.PREFER_NOT_TO_SAY,
    };
    break;

  case "EVERYONE":
    genderFilter = {};
    break;

  default:
    genderFilter = {};
    break;
}

  // ============================================
  // 2. GET CONVERSATION USERS
  // ============================================

  const conversations =
    await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId,
            deletedAt: null,
            clearedAt: null,
          },
        },
      },

      select: {
        participants: {
          where: {
            userId: {
              not: userId,
            },

            user: {
              account_status: {
                not: AccountStatus.DELETED,
              },

              ...genderFilter,
            },
          },

          select: {
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
                    media_url: true,
                  },
                },
              },
            },
          },
        },
      },
    });

  // ============================================
  // 3. UNIQUE USERS
  // ============================================

  const users = [
    ...new Map(
      conversations
        .flatMap((conversation) =>
          conversation.participants.map(
            (participant) => participant.user,
          ),
        )
        .map((user) => [user.id, user]),
    ).values(),
  ];

  // ============================================
  // 4. DECLINED REQUEST CHECK
  // ============================================

  const declinedRequests =
    await prisma.datePlanRequest.findMany({
      where: {
        planId,

        plan: {
          userId,
        },

        requesterId: {
          in: users.map((user) => user.id),
        },

        status: "DECLINED",
      },

      select: {
        requesterId: true,
      },
    });

  return {
    users,
    declinedUserIds: new Set(
      declinedRequests.map(
        (request) => request.requesterId,
      ),
    ),
  };
},
};
