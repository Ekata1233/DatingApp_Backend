import { MessagePermission } from "@prisma/client";
import { createPrivacySettingsRepository, getPrivacySettingsRepository, updatePrivacySettingsRepository } from "./privacy-controls.repository";



interface UpdatePrivacySettingsInput {
  messagePermission?: MessagePermission;
  hideFromContacts?: boolean;
  ghostMode?: boolean;
}

export const getPrivacySettingsService = async (
  userId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  let settings =
    await getPrivacySettingsRepository(userId);

  // First time user opens privacy controls
  if (!settings) {
    settings =
      await createPrivacySettingsRepository(userId);
  }

  return {
    id: settings.id,

    messagePermission: {
      value: settings.messagePermission,
      label:
        getMessagePermissionLabel(
          settings.messagePermission,
        ),
    },

    hideFromContacts:
      settings.hideFromContacts,

    ghostMode:
      settings.ghostMode,
  };
};

export const updatePrivacySettingsService = async (
  userId: string,
  data: UpdatePrivacySettingsInput,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const {
    messagePermission,
    hideFromContacts,
    ghostMode,
  } = data;

  if (
    messagePermission === undefined &&
    hideFromContacts === undefined &&
    ghostMode === undefined
  ) {
    throw new Error(
      "At least one privacy setting is required",
    );
  }

  // ==========================================
  // Validate message permission
  // ==========================================

  if (messagePermission !== undefined) {
    if (
      !Array.isArray(messagePermission) ||
      messagePermission.length === 0
    ) {
      throw new Error(
        "messagePermission must be a non-empty array",
      );
    }

    const invalidPermission =
      messagePermission.find(
        (permission) =>
          !Object.values(
            MessagePermission,
          ).includes(permission),
      );

    if (invalidPermission) {
      throw new Error(
        `Invalid message permission: ${invalidPermission}`,
      );
    }
  }

  // ==========================================
  // Validate hideFromContacts
  // ==========================================

  if (
    hideFromContacts !== undefined &&
    typeof hideFromContacts !== "boolean"
  ) {
    throw new Error(
      "hideFromContacts must be a boolean value",
    );
  }

  // ==========================================
  // Validate ghostMode
  // ==========================================

  if (
    ghostMode !== undefined &&
    typeof ghostMode !== "boolean"
  ) {
    throw new Error(
      "ghostMode must be a boolean value",
    );
  }

  const settings =
    await updatePrivacySettingsRepository(
      userId,
      {
        messagePermission,
        hideFromContacts,
        ghostMode,
      },
    );

  return {
    id: settings.id,

    messagePermission:
      settings.messagePermission.map(
        (permission) => ({
          value: permission,
          label:
            getMessagePermissionLabel(
              permission,
            ),
        }),
      ),

    hideFromContacts:
      settings.hideFromContacts,

    ghostMode:
      settings.ghostMode,

    updatedAt:
      settings.updatedAt,
  };
};

const getMessagePermissionLabel = (
  permission: MessagePermission,
) => {
  switch (permission) {
    case MessagePermission.MATCHES_ONLY:
      return "Matches only";

    case MessagePermission.VERIFIED_ONLY:
      return "Verified only";

    case MessagePermission.PAID_ONLY:
      return "Paid only";

    default:
      return "Matches only";
  }
};