// rose.types.ts

export interface SendRoseDTO {
  receiverId: string;
}

export interface RoseResponse {
  id: string;
  senderId: string;
  receiverId: string;
  message?: string;
  createdAt: Date;
  sender?: {
    id: string;
    full_name: string;
    photos: string[];
  };
}

export interface RoseBalanceResponse {
  totalRoses: number;
  lastResetAt: Date;
}

export interface RoseTransaction {
  id: string;
  senderId: string;
  receiverId: string;
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