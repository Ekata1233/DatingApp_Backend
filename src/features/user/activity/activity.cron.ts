import cron from "node-cron";

import { prisma } from "../../../prisma/prismaClient";

import {
  addCalendarDays,
  calculateActivityStatus,
  getIstDay,
  getLastActiveDaysAgo,
} from "./activity.utils";

const BATCH_SIZE = 500;

export const recalculateUserActivity = async () => {
  const now = new Date();
  const todayIst = getIstDay(now);

  const sevenDayStart = addCalendarDays(todayIst, -6);
  const retentionStart = addCalendarDays(todayIst, -60);

  let cursor: string | undefined;

  while (true) {
    const users = await prisma.user.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        id: true,
        last_active_at: true,
      },
      orderBy: {
        id: "asc",
      },
      take: BATCH_SIZE,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
    });

    if (users.length === 0) {
      break;
    }

    const userIds = users.map((user) => user.id);

    const activityDays = await prisma.userActivityDay.groupBy({
      by: ["userId"],
      where: {
        userId: {
          in: userIds,
        },
        dayIst: {
          gte: sevenDayStart,
          lte: todayIst,
        },
      },
      _count: {
        userId: true,
      },
    });

    const counts = new Map(
      activityDays.map((item) => [
        item.userId,
        item._count.userId,
      ])
    );

    for (const user of users) {
      const activeDays7 = counts.get(user.id) ?? 0;

      const lastActiveDaysAgo = getLastActiveDaysAgo(
        user.last_active_at,
        now
      );

      const status = calculateActivityStatus(
        activeDays7,
        lastActiveDaysAgo
      );

      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          active_days_7: activeDays7,
          activity_status: status,
        },
      });
    }

    cursor = users[users.length - 1].id;
  }

  // Keep only the last 60 IST calendar dates.
  await prisma.userActivityDay.deleteMany({
    where: {
      dayIst: {
        lt: retentionStart,
      },
    },
  });

  console.log("User activity recalculation completed");
};

export const startActivityCron = () => {
  cron.schedule(
    "15 0 * * *",
    async () => {
      try {
        await recalculateUserActivity();
      } catch (error) {
        console.error(
          "Activity cron failed:",
          error
        );
      }
    },
    {
      timezone: "Asia/Kolkata",
      noOverlap: true,
    }
  );
};