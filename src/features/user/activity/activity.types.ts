import { ActivityStatus } from "@prisma/client";

export interface UserActivityResponse {
  status: ActivityStatus;
  activeDays7: number;
  lastActiveAt: Date | null;
}

export interface ActivityHeartbeatInput {
  userId: string;
  sessionSeconds: number;
}

export interface ActivityCardConfig {
  title: string;
  icon: string;
  subtitle: string;
  description: string;
  suggestion: string;
  replyChance: {
    label: string;
    percentage: number;
  } | null;
}