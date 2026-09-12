import { Request, Response } from "express";
import { firebaseMessaging } from "../../config/firebase";

export const testPushNotificationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { fcmToken } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: "FCM token is required",
      });
    }

    const response = await firebaseMessaging.send({
      token: fcmToken,

      notification: {
        title: "Welvors Test Notification ❤️",
        body: "Firebase push notification is working successfully.",
      },

      data: {
        type: "TEST_NOTIFICATION",
        screen: "HOME",
      },

      android: {
        priority: "high",
        notification: {
          sound: "default",
        },
      },

      apns: {
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    console.log("FCM RESPONSE:", response);

    return res.status(200).json({
      success: true,
      message: "Push notification sent successfully",
      data: {
        messageId: response,
      },
    });
  } catch (error: any) {
    console.error("FCM TEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send push notification",
      errorCode: error.code || null,
    });
  }
};