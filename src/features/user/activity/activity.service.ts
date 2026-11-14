import { prisma } from "../../../prisma/prismaClient";
import { redis } from "../../../lib/redis";

import {
  ACTIVITY_CARD_CONFIG,
  addCalendarDays,
  calculateActivityStatus,
  getIstDay,
} from "./activity.utils";

import { UserActivityResponse } from "./activity.types";
import { ActivityStatus } from "@prisma/client";

const MIN_SESSION_SECONDS = 10;
const HEARTBEAT_THROTTLE_SECONDS = 300;

const getThrottleKey = (userId: string) => `activity:heartbeat:${userId}`;

export const recordUserActivityService = async (
  userId: string,
  sessionSeconds: number,
): Promise<UserActivityResponse> => {
  if (
    !Number.isFinite(sessionSeconds) ||
    sessionSeconds < MIN_SESSION_SECONDS
  ) {
    throw new Error("Foreground session must be at least 10 seconds");
  }

  const now = new Date();
  const todayIst = getIstDay(now);
  const sevenDayStart = addCalendarDays(todayIst, -6);

  // Redis optimization: avoid repeated DB writes.
  // NX prevents multiple requests from acquiring the
  // same throttle key simultaneously.
  const throttleKey = getThrottleKey(userId);

  const acquired = await redis.set(throttleKey, "1", {
    nx: true,
    ex: HEARTBEAT_THROTTLE_SECONDS,
  });

  if (acquired !== "OK") {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        activity_status: true,
        active_days_7: true,
        last_active_at: true,
      },
    });

    if (!existing) {
      throw new Error("User not found");
    }

    return {
      status: existing.activity_status!,
      activeDays7: existing.active_days_7,
      lastActiveAt: existing.last_active_at,
    };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          activity_status: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // One record per IST calendar day.
      await tx.userActivityDay.upsert({
        where: {
          userId_dayIst: {
            userId,
            dayIst: todayIst,
          },
        },
        update: {},
        create: {
          userId,
          dayIst: todayIst,
        },
      });

      // Count qualifying active days in the last 7 days.
      const activeDays7 = await tx.userActivityDay.count({
        where: {
          userId,
          dayIst: {
            gte: sevenDayStart,
            lte: todayIst,
          },
        },
      });

      // Current heartbeat means user is active today.
      const status = calculateActivityStatus(activeDays7, 0);

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          last_active_at: now,
          active_days_7: activeDays7,
          activity_status: status,
        },
        select: {
          activity_status: true,
          active_days_7: true,
          last_active_at: true,
        },
      });

      return {
        previousStatus: user.activity_status,
        status: updatedUser.activity_status,
        activeDays7: updatedUser.active_days_7,
        lastActiveAt: updatedUser.last_active_at,
      };
    });

    if (result.previousStatus === "NAPPING" && result.status !== "NAPPING") {
      // TODO: Enqueue ActivityWatch notifications.
      // Do not send notifications inside the DB transaction.
    }

    return {
      status: result.status!,
      activeDays7: result.activeDays7,
      lastActiveAt: result.lastActiveAt,
    };
  } catch (error) {
    // Allow the next heartbeat to retry after failure.
    await redis.del(throttleKey).catch(console.error);
    throw error;
  }
};

// ==========================================
// GET USER ACTIVITY CARD SERVICE
// ==========================================

export const getUserActivityCardService = async (
  currentUserId: string,
  targetUserId: string,
) => {
  // ==========================================
  // 1. FETCH CURRENT USER AND TARGET USER
  // ==========================================

  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
      select: {
        id: true,
        show_activity: true,
      },
    }),

    prisma.user.findUnique({
      where: {
        id: targetUserId,
      },
      select: {
        id: true,
        activity_status: true,
        active_days_7: true,
        last_active_at: true,
        show_activity: true,
        account_status: true,
        deleted_at: true,
      },
    }),
  ]);

  // ==========================================
  // 2. VALIDATE USERS
  // ==========================================

  if (!currentUser) {
    throw new Error("Current user not found");
  }

  if (
    !targetUser ||
    targetUser.account_status !== "ACTIVE" ||
    targetUser.deleted_at !== null
  ) {
    throw new Error("User not found");
  }

  // ==========================================
  // 3. CHECK ACTIVITY PRIVACY
  // ==========================================

  const canShowActivity =
    currentUser.show_activity === true && targetUser.show_activity === true;

  if (!canShowActivity) {
    return null;
  }

  // ==========================================
  // 4. CHECK USER ACTIVITY
  // ==========================================

  // if (!targetUser.last_active_at) {
  //   return null;
  // }

  // ==========================================
  // 5. GET ACTIVITY CARD DATA
  // ==========================================

const status: ActivityStatus =
  !targetUser.last_active_at ||
  targetUser.activity_status === null
    ? ActivityStatus.RELAXED
    : targetUser.activity_status;

  const config = ACTIVITY_CARD_CONFIG[status];

  // ==========================================
  // 6. RETURN RESPONSE
  // ==========================================

  return {
    userId: targetUser.id,
    activity: `${config.icon} ${config.title}`,
    status,
    title: config.title,
    icon: config.icon,
    subtitle: config.subtitle,
    activeDaysLast7: targetUser.active_days_7,
    replyChance: config.replyChance,
    description: config.description,
    suggestion: config.suggestion,
    footer: "Welvors never shows exact times.",
  };
};
