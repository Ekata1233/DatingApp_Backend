// Working on this file: src/features/notification/notification.repository.ts

import { getIO } from "../../config/socket";
import { prisma } from "../../prisma/prismaClient";
import { incrementBadgeCount } from "./badge.service";
import { sendPushNotification } from "./push.service";

export const createNotification = async ({
  sender_id,
  receiver_id,
  type,
  message,
}: {
  sender_id: string;
  receiver_id: string;
  type: "LIKE" | "MATCH" | "MESSAGE";
  message: string;
}) => {
  const notification = await prisma.notification.create({
    data: {
      sender_id,
      receiver_id,
      type,
      message,
    },
  });

  // 🔥 REAL-TIME EMIT
  const io = getIO();
  io.to(receiver_id).emit("new_notification", notification);

   // Badge increment
  await incrementBadgeCount(receiver_id);

  // Push notification
  await sendPushNotification(
    receiver_id,
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