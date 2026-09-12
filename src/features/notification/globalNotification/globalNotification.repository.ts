import { prisma } from "../../../prisma/prismaClient";
import { UpdateGlobalNotificationInput } from "./globalNotification.types";

/**
 * Get user notification settings
 */
export const getGlobalNotificationSettingRepository = async (
  userId: string,
) => {
  return prisma.userNotificationSetting.findUnique({
    where: {
      userId,
    },
  });
};

/**
 * Create default notification settings
 *
 * All notifications are ON by default.
 */
export const createGlobalNotificationSettingRepository = async (
  userId: string,
) => {
  return prisma.userNotificationSetting.create({
    data: {
      userId,

      isEnabled: true,

      newMatchesEnabled: true,
      messagesEnabled: true,
      likesRosesEnabled: true,
      eventsEnabled: true,
      promotionsEnabled: true,
    },
  });
};

/**
 * Update notification settings
 *
 * Uses upsert because older users may not
 * have UserNotificationSetting row.
 */
export const updateGlobalNotificationSettingRepository = async (
  userId: string,
  data: UpdateGlobalNotificationInput,
) => {
  return prisma.userNotificationSetting.upsert({
    where: {
      userId,
    },

    create: {
      userId,

      isEnabled:
        data.isEnabled ?? true,

      newMatchesEnabled:
        data.newMatchesEnabled ?? true,

      messagesEnabled:
        data.messagesEnabled ?? true,

      likesRosesEnabled:
        data.likesRosesEnabled ?? true,

      eventsEnabled:
        data.eventsEnabled ?? true,

      promotionsEnabled:
        data.promotionsEnabled ?? true,
    },

    update: data,
  });
};