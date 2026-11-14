import { ActivityStatus } from "@prisma/client";

export const maskName = (
  name?: string | null,
): string => {
  if (!name?.trim()) {
    return "•••••";
  }

  const first =
    name.trim().charAt(0).toUpperCase();

  return `${first}••••`;
};

export const maskAge = (
  age?: number | null,
): string | null => {
  if (!age) {
    return null;
  }

  const ageString =
    String(age);

  return `${ageString.charAt(0)}•`;
};



export const ACTIVITY_TAGS: Record<
  ActivityStatus,
  { label: string; icon: string }
> = {
  ACTIVE: {
    label: "Active",
    icon: "⚡",
  },
  FREQUENT: {
    label: "Frequent",
    icon: "🌿",
  },
  RELAXED: {
    label: "Relaxed",
    icon: "🌙",
  },
  BUSY: {
    label: "Busy",
    icon: "💼",
  },
  NAPPING: {
    label: "Napping",
    icon: "😴",
  },
};


export type FeedActivity = {
  status: ActivityStatus;
  label: string;
  icon: string;
} | null;