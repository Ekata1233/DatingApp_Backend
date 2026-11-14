import { prisma } from "../../../prisma/prismaClient";
import { redis } from "../../../lib/redis";

import {
  addCalendarDays,
  calculateActivityStatus,
  getIstDay,
} from "./activity.utils";

import { UserActivityResponse } from "./activity.types";

const MIN_SESSION_SECONDS = 10;
const HEARTBEAT_THROTTLE_SECONDS = 300;

const getThrottleKey = (userId: string) =>
  `activity:heartbeat:${userId}`;

export const recordUserActivityService = async (
  userId: string,
  sessionSeconds: number
): Promise<UserActivityResponse> => {
  if (
    !Number.isFinite(sessionSeconds) ||
    sessionSeconds < MIN_SESSION_SECONDS
  ) {
    throw new Error(
      "Foreground session must be at least 10 seconds"
    );
  }

  const now = new Date();
  const todayIst = getIstDay(now);
  const sevenDayStart = addCalendarDays(todayIst, -6);

  // Redis optimization: avoid repeated DB writes.
  // NX prevents multiple requests from acquiring the
  // same throttle key simultaneously.
  const throttleKey = getThrottleKey(userId);

  const acquired = await redis.set(
    throttleKey,
    "1",
    {
      nx: true,
      ex: HEARTBEAT_THROTTLE_SECONDS,
    }
  );

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
      const status = calculateActivityStatus(
        activeDays7,
        0
      );

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

    if (
      result.previousStatus === "NAPPING" &&
      result.status !== "NAPPING"
    ) {
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