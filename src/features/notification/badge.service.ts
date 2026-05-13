import { prisma } from "../../prisma/prismaClient";


export const incrementBadgeCount = async (
  userId: string
) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      badge_count: {
        increment: 1,
      },
    },
  });
};

export const resetBadgeCount = async (
  userId: string
) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      badge_count: 0,
    },
  });
};