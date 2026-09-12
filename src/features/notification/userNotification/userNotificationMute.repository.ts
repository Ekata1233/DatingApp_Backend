import { prisma } from "../../../prisma/prismaClient";

export const findUserNotificationMuteRepository = async (
  userId: string,
  mutedUserId: string,
) => {
  return prisma.userNotificationMute.findUnique({
    where: {
      userId_mutedUserId: {
        userId,
        mutedUserId,
      },
    },
  });
};

export const muteUserNotificationRepository = async (
  userId: string,
  mutedUserId: string,
) => {
  return prisma.userNotificationMute.upsert({
    where: {
      userId_mutedUserId: {
        userId,
        mutedUserId,
      },
    },

    create: {
      userId,
      mutedUserId,
      isMuted: true,
      mutedUntil: null,
    },

    update: {
      isMuted: true,
      mutedUntil: null,
    },
  });
};

export const unmuteUserNotificationRepository = async (
  userId: string,
  mutedUserId: string,
) => {
  return prisma.userNotificationMute.upsert({
    where: {
      userId_mutedUserId: {
        userId,
        mutedUserId,
      },
    },

    create: {
      userId,
      mutedUserId,
      isMuted: false,
      mutedUntil: null,
    },

    update: {
      isMuted: false,
      mutedUntil: null,
    },
  });
};

export const getMutedUsersRepository = async (
  userId: string,
) => {
  return prisma.userNotificationMute.findMany({
    where: {
      userId,
      isMuted: true,
    },

    include: {
      mutedUser: {
        select: {
          id: true,
          full_name: true,
        },
      },
    },

    orderBy: {
      updatedAt: "desc",
    },
  });
};

export const getUserMuteStatusRepository = async (
  userId: string,
  targetUserId: string,
) => {
  return prisma.userNotificationMute.findUnique({
    where: {
      userId_mutedUserId: {
        userId,
        mutedUserId: targetUserId,
      },
    },

    select: {
      mutedUserId: true,
      isMuted: true,
      mutedUntil: true,
    },
  });
};