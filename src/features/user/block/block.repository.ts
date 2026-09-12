import { prisma } from "../../../prisma/prismaClient";


export const getBlockedUserRecordsRepository = async (
  userId: string,
) => {
  return prisma.userBlock.findMany({
    where: {
      blockerId: userId,
    },

    select: {
      id: true,
      blockedId: true,
      createdAt: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};