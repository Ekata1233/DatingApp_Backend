// Working on this file: src/features/notification/notification.repository.ts

import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";
import { incrementBadgeCount } from "./badge.service";
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