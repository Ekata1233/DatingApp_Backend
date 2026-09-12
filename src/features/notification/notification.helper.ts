import { NotificationType } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";

export const canSendPushNotification = async ({
  senderId,
  receiverId,
  type,
}: {
  senderId: string;
  receiverId: string;
  type: NotificationType;
}) => {
  // ==========================================
  // 1. GLOBAL NOTIFICATION SETTINGS
  // ==========================================

  const setting =
    await prisma.userNotificationSetting.findUnique({
      where: {
        userId: receiverId,
      },
    });

  // If no setting exists, default = notifications ON
  if (setting) {
    // Master switch OFF
    if (!setting.isEnabled) {
      return false;
    }

    // Temporary global mute
    if (
      setting.mutedUntil &&
      setting.mutedUntil > new Date()
    ) {
      return false;
    }

    // ==========================================
    // 2. CATEGORY CHECK
    // ==========================================

    switch (type) {
      case NotificationType.NEW_MATCH:
        if (!setting.newMatchesEnabled) {
          return false;
        }
        break;

      case NotificationType.NEW_MESSAGE:
        if (!setting.messagesEnabled) {
          return false;
        }
        break;

      case NotificationType.NEW_LIKE:
      case NotificationType.NEW_ROSE:
      case NotificationType.SUPER_LIKE:
        if (!setting.likesRosesEnabled) {
          return false;
        }
        break;

      case NotificationType.EVENT_INVITE:
      case NotificationType.EVENT_RESPONSE:
        if (!setting.eventsEnabled) {
          return false;
        }
        break;
    }
  }

  // ==========================================
  // 3. PARTICULAR USER MUTE CHECK
  // ==========================================

  const mute =
    await prisma.userNotificationMute.findUnique({
      where: {
        userId_mutedUserId: {
          userId: receiverId,
          mutedUserId: senderId,
        },
      },

      select: {
        isMuted: true,
        mutedUntil: true,
      },
    });

  if (mute?.isMuted) {
    // Permanent mute
    if (!mute.mutedUntil) {
      return false;
    }

    // Temporary mute still active
    if (
      mute.mutedUntil > new Date()
    ) {
      return false;
    }
  }

  // ==========================================
  // 4. ALLOWED
  // ==========================================

  return true;
};