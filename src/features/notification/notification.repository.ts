// Working on this file: src/features/notification/notification.repository.ts

import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
const buildNotificationWhere = (
  userId: string,
  types?: NotificationType[],
  unreadOnly = false,
): Prisma.NotificationWhereInput => {
  return {
    receiver_id: userId,

    // Always exclude chat message notifications
    type: {
      not: NotificationType.NEW_MESSAGE,

      ...(types && types.length > 0
        ? { in: types }
        : {}),
    },

    ...(unreadOnly
      ? { is_read: false }
      : {}),
  };
};
export const getNotificationsRepository = async (
  userId: string,
  skip: number,
  take: number,
  types?: NotificationType[],
) => {
  return prisma.notification.findMany({
    where: buildNotificationWhere(
      userId,
      types,
    ),

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
              id: true,
              media_url: true,
            },
            take: 1,
          },
        },
      },
    },

    orderBy: [
      { created_at: "desc" },
      { id: "desc" },
    ],

    skip,
    take,
  });
};

export const getNotificationCountRepository = async (
  userId: string,
  types?: NotificationType[],
) => {
  return prisma.notification.count({
    where: buildNotificationWhere(
      userId,
      types,
    ),
  });
};

export const getUnreadNotificationCountRepository = async (
  userId: string,
  types?: NotificationType[],
) => {
  return prisma.notification.count({
    where: buildNotificationWhere(
      userId,
      types,
      true,
    ),
  });
};

export const findNotificationByIdRepository = async (
  notificationId: string,
  userId: string,
) => {
  return prisma.notification.findFirst({
    where: {
      id: notificationId,
      receiver_id: userId,
    },
  });
};

export const markNotificationReadRepository = async (
  notificationId: string,
) => {
  return prisma.notification.update({
    where: {
      id: notificationId,
    },

    data: {
      is_read: true,
      readAt: new Date(),
    },
  });
};

export const markAllNotificationsReadRepository = async (
  userId: string,
) => {
  return prisma.notification.updateMany({
    where: buildNotificationWhere(
      userId,
      undefined,
      true,
    ),

    data: {
      is_read: true,
      readAt: new Date(),
    },
  });
};

/**
 * Get user's notification setting
 */
export const getNotificationSettingRepository = async (
  userId: string,
) => {
  return prisma.userNotificationSetting.findUnique({
    where: {
      userId,
    },
  });
};

/**
 * Create default notification setting
 */
export const createNotificationSettingRepository = async (
  userId: string,
) => {
  return prisma.userNotificationSetting.create({
    data: {
      userId,
      isEnabled: true,
    },
  });
};

/**
 * Update notification setting
 */
export const updateNotificationSettingRepository = async (
  userId: string,
  isEnabled: boolean,
) => {
  return prisma.userNotificationSetting.upsert({
    where: {
      userId,
    },

    create: {
      userId,
      isEnabled,
    },

    update: {
      isEnabled,
    },
  });
};