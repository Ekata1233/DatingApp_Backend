// Working on this file: src/features/notification/notification.repository.ts

import { NotificationType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const getNotificationsRepository = async (
  userId: string,
  skip: number,
  take: number,
  types?: NotificationType[],
) => {
  return prisma.notification.findMany({
    where: {
      receiver_id: userId,

      ...(types && types.length > 0
        ? {
            type: {
              in: types,
            },
          }
        : {}),
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
              id: true,
              media_url: true,
            },
            take: 1,
          },
        },
      },
    },

    orderBy: {
      created_at: "desc",
    },

    skip,
    take,
  });
};

export const getNotificationCountRepository = async (
  userId: string,
  types?: NotificationType[],
) => {
  return prisma.notification.count({
    where: {
      receiver_id: userId,

      ...(types && types.length > 0
          ? {
              type: {
                in: types,
              },
            }
          : {}),
      },
  });
};

export const getUnreadNotificationCountRepository = async (
  userId: string,
  types?: NotificationType[],
) => {
  return prisma.notification.count({
    where: {
      receiver_id: userId,
      is_read: false,
       ...(types && types.length > 0
          ? {
              type: {
                in: types,
              },
            }
          : {}),
    },
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
    where: {
      receiver_id: userId,
      is_read: false,
    },

    data: {
      is_read: true,
      readAt: new Date(),
    },
  });
};