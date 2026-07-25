// rose.types.ts
import { RoseType } from '@prisma/client';

export interface SendRoseDTO {
  receiverId: string;
  roseType: RoseType;
}

export interface RoseResponse {
  id: string;
  senderId: string;
  receiverId: string;
  type: RoseType;
  message?: string;
  createdAt: Date;
  sender?: {
    id: string;
    name: string;
    photos: string[];
  };
}

export interface RoseBalanceResponse {
  purchasedRoses: number;
  totalRoses: number;
  lastResetAt: Date;
}

export interface RoseTransaction {
  id: string;
  senderId: string;
  receiverId: string;
  type: RoseType;
  createdAt: Date;
}

export interface SendRoseResponse {
  success: boolean;
  message: string;
  data: {
    rose: RoseResponse;
    remainingBalance: RoseBalanceResponse;
  };
}

export interface RoseHistoryQuery {
  type?: 'sent' | 'received';
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginatedRoseHistory {
  roses: RoseTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}