
import { prisma } from "../../../prisma/prismaClient";
import * as repository from "./userNotificationMute.repository";

export const muteUserNotificationService = async (
  userId: string,
  mutedUserId: string,
) => {
  if (!mutedUserId) {
    throw new Error("Muted user ID is required");
  }

  if (userId === mutedUserId) {
    throw new Error(
      "You cannot mute your own notifications",
    );
  }

  const userExists =
    await prisma.user.findUnique({
      where: {
        id: mutedUserId,
      },

      select: {
        id: true,
      },
    });

  if (!userExists) {
    throw new Error("User not found");
  }

  const mute =
    await repository.muteUserNotificationRepository(
      userId,
      mutedUserId,
    );

  return {
    mutedUserId: mute.mutedUserId,
    isMuted: mute.isMuted,
    mutedUntil: mute.mutedUntil,
  };
};

export const unmuteUserNotificationService = async (
  userId: string,
  mutedUserId: string,
) => {
  if (!mutedUserId) {
    throw new Error("Muted user ID is required");
  }

  if (userId === mutedUserId) {
    throw new Error(
      "You cannot unmute your own notifications",
    );
  }

  const mute =
    await repository.unmuteUserNotificationRepository(
      userId,
      mutedUserId,
    );

  return {
    mutedUserId: mute.mutedUserId,
    isMuted: mute.isMuted,
    mutedUntil: mute.mutedUntil,
  };
};

export const getMutedUsersService = async (
  userId: string,
) => {
  const mutedUsers =
    await repository.getMutedUsersRepository(
      userId,
    );

  return mutedUsers.map((item) => ({
    id: item.id,

    mutedUserId:
      item.mutedUserId,

    isMuted:
      item.isMuted,

    mutedUntil:
      item.mutedUntil,

    user:
      item.mutedUser,
  }));
};

export const getUserMuteStatusService = async (
  userId: string,
  targetUserId: string,
) => {
  if (!targetUserId) {
    throw new Error("User ID is required");
  }

  if (userId === targetUserId) {
    return {
      userId: targetUserId,
      isMuted: false,
      mutedUntil: null,
    };
  }

  const mute =
    await repository.getUserMuteStatusRepository(
      userId,
      targetUserId,
    );

  if (!mute) {
    return {
      userId: targetUserId,
      isMuted: false,
      mutedUntil: null,
    };
  }

  let isMuted = mute.isMuted;

  if (
    mute.mutedUntil &&
    mute.mutedUntil <= new Date()
  ) {
    isMuted = false;
  }

  return {
    userId: targetUserId,
    isMuted,
    mutedUntil:
      isMuted ? mute.mutedUntil : null,
  };
};