import { firebaseMessaging } from "../../config/firebase";
import { prisma } from "../../prisma/prismaClient";
import { NotificationType } from "@prisma/client";

interface SendPushNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const sendPushNotification = async ({
  userId,
  type,
  title,
  body,
  data = {},
}: SendPushNotificationParams) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },

    select: {
      device_token: true,
      badge_count: true,
    },
  });

  if (!user?.device_token) {
    console.log(
      `No FCM token found for user: ${userId}`,
    );

    return;
  }

  /*
   * Firebase data values must be strings.
   */
  const firebaseData: Record<string, string> = {
    type: String(type),
  };

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      firebaseData[key] = String(value);
    }
  });

  // const notificationTag = data.senderId
  //   ? `chat_${data.senderId}`
  //   : data.conversationId
  //   ? `chat_${data.conversationId}`
  //   : undefined;

  const notificationTag =
  type === "NEW_MESSAGE"
    ? data.conversationId
      ? `chat_${data.conversationId}`
      : data.senderId
      ? `chat_${data.senderId}`
      : undefined
    : undefined;

  
  try {
    const response = await firebaseMessaging.send({
      token: user.device_token,

      notification: {
        title,
        body,
      },

      data: firebaseData,

      android: {
        priority: "high",
        ...(notificationTag ? { collapseKey: notificationTag } : {}),
        notification: {
          sound: "default",
          channelId: "high_importance_channel", 
          ...(notificationTag ? { tag: notificationTag } : {}),
        },
      },

      apns: {
        payload: {
          aps: {
            badge: user.badge_count,
            sound: "default",
            ...(notificationTag ? { threadId: notificationTag } : {}),
          },
        },
      },
    });

    console.log(
      "Push notification sent:",
      response,
    );

    return response;
  } catch (error: any) {
    console.error(
      "FCM push notification error:",
      error,
    );

    throw error;
  }
};