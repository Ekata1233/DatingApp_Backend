import admin from "../../config/firebase";
import { prisma } from "../../prisma/prismaClient";

export const sendPushNotification = async (
  userId: string,
  title: string,
  body: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      device_token: true,
      badge_count: true,
    },
  });

  if (!user?.device_token) {
    return;
  }

  await admin.messaging().send({
    token: user.device_token,
    notification: {
      title,
      body,
    },
    android: {
      notification: {
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          badge: user.badge_count,
          sound: "default",
        },
      },
    },
  });
};