// account.service.ts

import { prisma } from "../../../prisma/prismaClient";



export const pauseAccountService = async (
  userId: string,
  reason?: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      account_status: true,
      deleted_at: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (
    user.account_status === "DELETED" ||
    user.deleted_at !== null
  ) {
    throw new Error("ACCOUNT_DELETED");
  }

  if (user.account_status === "PAUSED") {
    throw new Error("ACCOUNT_ALREADY_PAUSED");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      account_status: "PAUSED",
      paused_at: new Date(),
      pause_reason: reason ?? null,
    },
    select: {
      id: true,
      account_status: true,
      paused_at: true,
      pause_reason: true,
    },
  });

  return updatedUser;
};

export const resumeAccountService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      account_status: true,
      deleted_at: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (
    user.account_status === "DELETED" ||
    user.deleted_at !== null
  ) {
    throw new Error("ACCOUNT_DELETED");
  }

  if (user.account_status === "ACTIVE") {
    throw new Error("ACCOUNT_ALREADY_ACTIVE");
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      account_status: "ACTIVE",
      paused_at: null,
      pause_reason: null,
    },
    select: {
      id: true,
      account_status: true,
      paused_at: true,
    },
  });
};

export const deleteAccountService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      account_status: true,
      deleted_at: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (
    user.account_status === "DELETED" ||
    user.deleted_at !== null
  ) {
    throw new Error("ACCOUNT_ALREADY_DELETED");
  }

  const deletedUser = await prisma.$transaction(async (tx) => {
    // Mark account deleted
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        account_status: "DELETED",
        deleted_at: new Date(),

        // Remove pause state
        paused_at: null,
        pause_reason: null,

        // User should no longer receive push notifications
        device_token: null,

        // Reset badge
        badge_count: 0,
      },
      select: {
        id: true,
        account_status: true,
        deleted_at: true,
      },
    });

    // Disable active matches
    await tx.userMatch.updateMany({
      where: {
        OR: [
          {
            user1Id: userId,
          },
          {
            user2Id: userId,
          },
        ],
      },
      data: {
        is_active: false,
      },
    });

    return updatedUser;
  });

  return deletedUser;
};