
import { MessagePermission } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const getPrivacySettingsRepository = async (
  userId: string,
) => {
  return prisma.userPrivacySettings.findUnique({
    where: {
      userId,
    },
  });
};

export const createPrivacySettingsRepository = async (
  userId: string,
) => {
  return prisma.userPrivacySettings.create({
    data: {
      userId,

      // These are already Prisma defaults,
      // but keeping them explicit is also fine.
      messagePermission: MessagePermission.MATCHES_ONLY,
      hideFromContacts: false,
      ghostMode: false,
    },
  });
};

export const updatePrivacySettingsRepository = async (
  userId: string,
  data: {
    messagePermission?: MessagePermission;
    hideFromContacts?: boolean;
    ghostMode?: boolean;
  },
) => {
  return prisma.userPrivacySettings.upsert({
    where: {
      userId,
    },

    update: {
      ...(data.messagePermission !== undefined && {
        messagePermission: data.messagePermission,
      }),

      ...(data.hideFromContacts !== undefined && {
        hideFromContacts: data.hideFromContacts,
      }),

      ...(data.ghostMode !== undefined && {
        ghostMode: data.ghostMode,
      }),
    },

    create: {
      userId,

      messagePermission:
        data.messagePermission ??
        MessagePermission.MATCHES_ONLY,

      hideFromContacts:
        data.hideFromContacts ?? false,

      ghostMode:
        data.ghostMode ?? false,
    },
  });
};