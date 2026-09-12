// Working on this file: src/features/notification/notification.repository.ts

import { NotificationType } from "@prisma/client";
import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";
import { incrementBadgeCount } from "./badge.service";
import { createNotificationSettingRepository, findNotificationByIdRepository, getNotificationCountRepository, getNotificationSettingRepository, getNotificationsRepository, getUnreadNotificationCountRepository, markAllNotificationsReadRepository, markNotificationReadRepository, updateNotificationSettingRepository } from "./notification.repository";
import { CreateNotificationParams, NotificationCategory, notificationCategoryMap, SaveDeviceTokenParams } from "./notification.types";
import { sendPushNotification } from "./push.service";
import { canSendPushNotification } from "./notification.helper";

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

  console.log("notification : ", notification)

  // 🔥 REAL-TIME EMIT
  const io = getIO();
  io.to(receiverId).emit("new_notification", notification);

  // Badge increment
  await incrementBadgeCount(receiverId);

  // ==========================================
  // 4. CHECK PUSH PERMISSION
  // ==========================================

  const canSendPush =
    await canSendPushNotification({
      senderId,
      receiverId,
      type,
    });

  // ==========================================
  // 5. SEND PUSH ONLY IF ALLOWED
  // ==========================================

  if (canSendPush) {
    await sendPushNotification({
      userId: receiverId,
      type,
      title,
      body: message ?? "",
      data,
    });
  } else {
    console.log(
      `Push notification skipped for receiver: ${receiverId}`,
    );
  }

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
  category: NotificationCategory = "ALL",
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const allowedCategories: NotificationCategory[] = [
    "ALL",
    "LIKES_ROSES",
    "MATCHES",
    "GIFTS",
    "DATES",
    "EVENTS",
  ];

  if (!allowedCategories.includes(category)) {
    throw new Error(
      "Invalid notification category",
    );
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

  let types:
    | NotificationType[]
    | undefined;

  if (category !== "ALL") {
    types =
      notificationCategoryMap[
      category
      ];
  }

  const [
    notifications,
    total,
    unreadCount,
  ] = await Promise.all([
    getNotificationsRepository(
      userId,
      skip,
      safeLimit,
      types,
    ),

    getNotificationCountRepository(
      userId,
      types,
    ),

    getUnreadNotificationCountRepository(
      userId,
      types,
    ),
  ]);

  return {
    category,

    notifications:
      notifications.map(
        (notification) => ({
          id: notification.id,

          type:
            notification.type,

          title:
            notification.title,

          message:
            notification.message,

          data:
            notification.data,

          isRead:
            notification.is_read,

          readAt:
            notification.readAt,

          createdAt:
            notification.created_at,

          sender:
            notification.sender
              ? {
                id:
                  notification
                    .sender.id,

                name:
                  notification
                    .sender
                    .full_name,

                birthDate:
                  notification
                    .sender
                    .birth_date,

                photo:
                  notification
                    .sender
                    .photos[0]
                    ?.media_url ??
                  null,
              }
              : null,
        }),
      ),

    pagination: {
      page: safePage,
      limit: safeLimit,
      total,

      totalPages:
        Math.ceil(
          total /
          safeLimit,
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

/**
 * Get current user's notification setting
 */
export const getNotificationSettingService = async (
  userId: string,
) => {
  let setting =
    await getNotificationSettingRepository(userId);

  // Existing users may not have settings yet
  if (!setting) {
    setting =
      await createNotificationSettingRepository(userId);
  }

  return {
    isEnabled: setting.isEnabled,
    mutedUntil: setting.mutedUntil,
  };
};

/**
 * Update notification ON / OFF
 */
export const updateNotificationSettingService = async (
  userId: string,
  isEnabled: boolean,
) => {
  if (typeof isEnabled !== "boolean") {
    throw new Error(
      "isEnabled must be a boolean value",
    );
  }

  const setting =
    await updateNotificationSettingRepository(
      userId,
      isEnabled,
    );

  return {
    isEnabled: setting.isEnabled,
    mutedUntil: setting.mutedUntil,
  };
};