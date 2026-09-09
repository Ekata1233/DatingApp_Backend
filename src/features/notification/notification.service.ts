// Working on this file: src/features/notification/notification.repository.ts

import { NotificationType } from "@prisma/client";
import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";
import { incrementBadgeCount } from "./badge.service";
import { findNotificationByIdRepository, getNotificationCountRepository, getNotificationsRepository, getUnreadNotificationCountRepository, markAllNotificationsReadRepository, markNotificationReadRepository } from "./notification.repository";
import { CreateNotificationParams, SaveDeviceTokenParams } from "./notification.types";
import { sendPushNotification } from "./push.service";

export const createNotification = async ({
  senderId,
  receiverId,
  type,
  title,
  message,
  data,
}: CreateNotificationParams) => {
  const notification = await prisma.notification.create({
    data: {
      sender_id: senderId,
      receiver_id: receiverId,
      type,
      title,
      message,
      data,
    },
  });

  // 🔥 REAL-TIME EMIT
  const io = getIO();
  io.to(receiverId).emit("new_notification", notification);

  // Badge increment
  await incrementBadgeCount(receiverId);

  // Push notification
  await sendPushNotification(
    receiverId,
    type,
    message
  );

  return notification;
};

export const getNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: { receiver_id: userId },
    orderBy: { created_at: "desc" },
  });
};

export const markAsRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
};

export const saveDeviceTokenService = async ({
  userId,
  deviceToken,
}: SaveDeviceTokenParams) => {
  const user = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      device_token: deviceToken,
    },
    select: {
      id: true,
      device_token: true,
    },
  });

  return user;
};

export const getNotificationsService = async (
  userId: string,
  page = 1,
  limit = 20,
  type?: NotificationType,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const safePage =
    page > 0
      ? page
      : 1;

  const safeLimit =
    limit > 0 && limit <= 100
      ? limit
      : 20;

  const skip =
    (safePage - 1) * safeLimit;

  const [
    notifications,
    total,
    unreadCount,
  ] = await Promise.all([
    getNotificationsRepository(
      userId,
      skip,
      safeLimit,
      type,
    ),

    getNotificationCountRepository(
      userId,
      type,
    ),

    getUnreadNotificationCountRepository(
      userId,
    ),
  ]);

  const data =
    notifications.map((notification) => ({
      id: notification.id,

      type: notification.type,

      title: notification.title,

      message: notification.message,

      data: notification.data,

      isRead: notification.is_read,

      readAt: notification.readAt,

      createdAt: notification.created_at,

      sender: {
        id: notification.sender.id,

        name:
          notification.sender.full_name,

        birthDate:
          notification.sender.birth_date,

        photo:
          notification.sender.photos[0]
            ?.media_url ?? null,
      },
    }));

  return {
    notifications: data,

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(
        total / safeLimit,
      ),
    },

    unreadCount,
  };
};

export const getUnreadCountService = async (
  userId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const unreadCount =
    await getUnreadNotificationCountRepository(
      userId,
    );

  return {
    unreadCount,
  };
};

export const markNotificationReadService = async (
  userId: string,
  notificationId: string,
) => {
  if (!notificationId) {
    throw new Error(
      "Notification ID is required",
    );
  }

  const notification =
    await findNotificationByIdRepository(
      notificationId,
      userId,
    );

  if (!notification) {
    throw new Error(
      "Notification not found",
    );
  }

  if (!notification.is_read) {
    await markNotificationReadRepository(
      notificationId,
    );
  }

  const unreadCount =
    await getUnreadNotificationCountRepository(
      userId,
    );

  // emitNotificationRead(
  //   userId,
  //   notificationId,
  // );

  // emitUnreadCount(
  //   userId,
  //   unreadCount,
  // );

  return {
    notificationId,
    isRead: true,
    unreadCount,
  };
};

export const markAllNotificationsReadService = async (userId: string) => {
  if (!userId) {
    throw new Error(
      "User ID is required",
    );
  }

  const result =
    await markAllNotificationsReadRepository(
      userId,
    );

  // emitNotificationsReadAll(userId);

  // emitUnreadCount(userId, 0);

  return {
    updatedCount: result.count,
    unreadCount: 0,
  };
};