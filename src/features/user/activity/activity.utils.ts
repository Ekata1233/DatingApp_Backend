import { ActivityStatus } from "@prisma/client";

const DAY_MS = 24 * 60 * 60 * 1000;

export const getIstDay = (date: Date): Date => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const getPart = (type: string): string => {
    const part = parts.find((p) => p.type === type);

    if (!part) {
      throw new Error(`Missing date part: ${type}`);
    }

    return part.value;
  };

  return new Date(
    Date.UTC(
      Number(getPart("year")),
      Number(getPart("month")) - 1,
      Number(getPart("day"))
    )
  );
};

export const addCalendarDays = (
  day: Date,
  days: number
): Date => {
  return new Date(day.getTime() + days * DAY_MS);
};

export const getLastActiveDaysAgo = (
  lastActiveAt: Date | null,
  now: Date
): number | null => {
  if (!lastActiveAt) {
    return null;
  }

  const today = getIstDay(now);
  const lastDay = getIstDay(lastActiveAt);

  return Math.max(
    0,
    Math.round(
      (today.getTime() - lastDay.getTime()) / DAY_MS
    )
  );
};

export const calculateActivityStatus = (
  activeDays7: number,
  lastActiveDaysAgo: number | null
): ActivityStatus => {
  if (
    lastActiveDaysAgo === null ||
    lastActiveDaysAgo > 30
  ) {
    return ActivityStatus.NAPPING;
  }

  if (activeDays7 >= 5) {
    return ActivityStatus.ACTIVE;
  }

  if (activeDays7 >= 2) {
    return ActivityStatus.FREQUENT;
  }

  if (
    activeDays7 >= 1 ||
    lastActiveDaysAgo <= 14
  ) {
    return ActivityStatus.RELAXED;
  }

  return ActivityStatus.BUSY;
};