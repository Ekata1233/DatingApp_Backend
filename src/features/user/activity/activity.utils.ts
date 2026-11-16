import { ActivityStatus } from "@prisma/client";
import { ActivityCardConfig } from "./activity.types";

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

export const ACTIVITY_CARD_CONFIG: Record<
  ActivityStatus,
  ActivityCardConfig
> = {
  ACTIVE: {
    title: "Active",
    icon: "⚡",
    subtitle: "Opened Welvors on 5–7 of the last 7 days",
    description:
      "On Welvors almost every day — a message or Rose now will likely be seen today.",
    suggestion: "Good time to say hi",
    replyChance: {
      label: "High",
      percentage: 90,
    },
  },

  FREQUENT: {
    title: "Frequent",
    icon: "🌿",
    subtitle: "Opened Welvors on 2–4 of the last 7 days",
    description:
      "Checks in a few times a week. A thoughtful message is a good way to start a conversation.",
    suggestion: "A thoughtful opener works best",
    replyChance: {
      label: "Good",
      percentage: 70,
    },
  },

  RELAXED: {
    title: "Relaxed",
    icon: "🌙",
    subtitle: "Active in the last 2 weeks",
    description:
      "Drops in now and then. Replies may take a few days — a message that shows you read their profile stands out.",
    suggestion: "Mention something from their profile",
    replyChance: {
      label: "Fair",
      percentage: 50,
    },
  },

  BUSY: {
    title: "Busy",
    icon: "💼",
    subtitle: "Checks in now and then",
    description:
      "Has been busy lately and checks in occasionally. Your message will be waiting.",
    suggestion: "Worth a message — no rush",
    replyChance: null,
  },

  NAPPING: {
    title: "Napping",
    icon: "😴",
    subtitle: "Not active for over a month",
    description:
      "Away from Welvors for a while. Your message will be waiting when they return.",
    suggestion: "Your chat stays warm till then",
    replyChance: null,
  },
};