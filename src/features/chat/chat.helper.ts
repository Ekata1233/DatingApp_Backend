import { Prisma } from "@prisma/client";

export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  tx: Prisma.TransactionClient
) => {
  const existingConversation = await tx.conversation.findFirst({
    where: {
      AND: [
        {
          participants: {
            some: {
              userId: user1Id,
              deletedAt: null,
            },
          },
        },
        {
          participants: {
            some: {
              userId: user2Id,
              deletedAt: null,
            },
          },
        },
      ],
    },
    include: {
      participants: true,
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return tx.conversation.create({
    data: {
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
    include: {
      participants: true,
    },
  });
};