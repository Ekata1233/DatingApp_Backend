import { Prisma } from "@prisma/client";

export const recordDailyFeedView = async (
  tx: Prisma.TransactionClient,
  userId: string,
  targetUserId: string,
) => {
  const now = new Date();

  // UTC calendar date
  const viewDate = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    ),
  );

  await tx.userDailyFeedView.upsert({
    where: {
      userId_targetUserId_viewDate: {
        userId,
        targetUserId,
        viewDate,
      },
    },
    update: {},
    create: {
      userId,
      targetUserId,
      viewDate,
    },
  });
};

export const findOrCreateMatchConversation = async (
  tx: Prisma.TransactionClient,
  user1Id: string,
  user2Id: string,
) => {
  // Check whether both users already share a conversation
  const existingConversation = await tx.conversation.findFirst({
    where: {
      participants: {
        some: {
          userId: user1Id,
        },
      },
      AND: [
        {
          participants: {
            some: {
              userId: user2Id,
            },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  if (existingConversation) {
    return existingConversation.id;
  }

  // Create conversation for matched users
  const conversation = await tx.conversation.create({
    data: {
      match: true,
      participants: {
        create: [
          {
            userId: user1Id,
          },
          {
            userId: user2Id,
          },
        ],
      },
    },
    select: {
      id: true,
    },
  });

  return conversation.id;
};