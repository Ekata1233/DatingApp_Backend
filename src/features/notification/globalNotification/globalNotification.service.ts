import * as repository from "./globalNotification.repository";

import { UpdateGlobalNotificationInput } from "./globalNotification.types";

/**
 * Get current user's notification settings
 */
export const getGlobalNotificationSettingService = async (
  userId: string,
) => {
  let setting =
    await repository.getGlobalNotificationSettingRepository(
      userId,
    );

  /**
   * Existing users may not have a settings row.
   *
   * In that case create default:
   * everything ON.
   */
  if (!setting) {
    setting =
      await repository.createGlobalNotificationSettingRepository(
        userId,
      );
  }

  return {
    isEnabled:
      setting.isEnabled,

    newMatchesEnabled:
      setting.newMatchesEnabled,

    messagesEnabled:
      setting.messagesEnabled,

    likesRosesEnabled:
      setting.likesRosesEnabled,

    eventsEnabled:
      setting.eventsEnabled,

    promotionsEnabled:
      setting.promotionsEnabled,

    mutedUntil:
      setting.mutedUntil,
  };
};


/**
 * Update notification settings
 */
export const updateGlobalNotificationSettingService = async (
  userId: string,
  data: UpdateGlobalNotificationInput,
) => {
  /**
   * Prevent empty body
   */
  if (
    !data ||
    Object.keys(data).length === 0
  ) {
    throw new Error(
      "At least one notification setting is required",
    );
  }

  /**
   * Allowed fields
   */
  const allowedFields: (
    keyof UpdateGlobalNotificationInput
  )[] = [
    "isEnabled",
    "newMatchesEnabled",
    "messagesEnabled",
    "likesRosesEnabled",
    "eventsEnabled",
    "promotionsEnabled",
  ];

  /**
   * Validate body fields
   */
  for (const key of Object.keys(data)) {
    if (
      !allowedFields.includes(
        key as keyof UpdateGlobalNotificationInput,
      )
    ) {
      throw new Error(
        `Invalid notification setting: ${key}`,
      );
    }

    if (
      typeof data[
        key as keyof UpdateGlobalNotificationInput
      ] !== "boolean"
    ) {
      throw new Error(
        `${key} must be a boolean value`,
      );
    }
  }

  const setting =
    await repository.updateGlobalNotificationSettingRepository(
      userId,
      data,
    );

  return {
    isEnabled:
      setting.isEnabled,

    newMatchesEnabled:
      setting.newMatchesEnabled,

    messagesEnabled:
      setting.messagesEnabled,

    likesRosesEnabled:
      setting.likesRosesEnabled,

    eventsEnabled:
      setting.eventsEnabled,

    promotionsEnabled:
      setting.promotionsEnabled,

    mutedUntil:
      setting.mutedUntil,
  };
};