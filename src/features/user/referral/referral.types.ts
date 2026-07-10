import { ReferralStatus } from "@prisma/client";

export interface ValidateReferralRequest {
  referralCode: string;
}

export interface ValidateReferralResponse {
  success: boolean;
  message: string;
  referrerName?: string;
}

export interface ReferralDashboardQuery {
  page?: number;
  limit?: number;
}

export interface ReferralHistoryItem {
  id: string;
  userId: string;

  name: string;
  profileImage: string | null;

  status: ReferralStatus;

  signupReward: number;
  purchaseReward: number;
  totalReward: number;

  joinedAt: Date;
  rewardedAt: Date | null;
}

export interface ReferralStatsResponse {
  totalEarned: number;
  joined: number;
  rewarded: number;
  pending: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ReferralDashboardResponse {
  referralCode: string;
  shareLink: string;

  stats: ReferralStatsResponse;

  history: ReferralHistoryItem[];

  pagination: PaginationResponse;
}