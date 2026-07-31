import { ComplimentStatus } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/*                                  Requests                                  */
/* -------------------------------------------------------------------------- */
export interface ComplimentBalanceResponse {
  totalCompliments: number;
  lastResetAt: Date;
}

export interface ComplimentResponse {
  id: string;
  senderId: string;
  receiverId: string;
  ideaId: string | null;
  message: string | null;
  status: ComplimentStatus;
  createdAt: Date;

  sender: {
    id: string;
    full_name: string;
    photos: string[];
  };
}

export interface SendComplimentResponse {
  success: boolean;
  message: string;
  data: {
    compliment: ComplimentResponse;
    remainingBalance: ComplimentBalanceResponse;
  };
}

export interface SendComplimentDto {
  receiverId: string;
  ideaId?: string;
  message?: string;
}

export interface PurchaseComplimentDto {
  quantity: number;
  paymentMethod: "WALLET" | "PAYMENT_GATEWAY";
}

export interface GetComplimentsQuery {
  page?: number;
  limit?: number;
  status?: ComplimentStatus;
}

export interface PaginationQuery {
  page: number;
  limit: number;
}

/* -------------------------------------------------------------------------- */
/*                                  Responses                                 */
/* -------------------------------------------------------------------------- */

export interface ComplimentCategoryResponse {
  id: string;
  name: string;
  sortOrder: number;
  ideas: ComplimentIdeaResponse[];
}

export interface ComplimentIdeaResponse {
  id: string;
  text: string;
  sortOrder: number;
}

export interface ComplimentBalanceResponse {
  totalCompliments: number;
  lastResetAt: Date;
}

export interface UserComplimentResponse {
  id: string;
  senderId: string;
  receiverId: string;
  ideaId?: string | null;
  message?: string | null;
  status: ComplimentStatus;
  createdAt: Date;
}

export interface PaginatedComplimentResponse {
  compliments: UserComplimentResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/*                             Internal Service Types                         */
/* -------------------------------------------------------------------------- */

export interface DeductComplimentResult {
  remainingBalance: number;
  deductedFrom: "FREE" | "PURCHASED";
}

export interface ComplimentAvailability {
  canSend: boolean;
  balance: number;
  reason?: string;
}

export interface CreateComplimentTransactionDto {
  userId: string;
  quantity: number;
  complimentBalanceAfter: number;
  purchaseId?: string;
}

export interface PurchaseComplimentResult {
  purchaseId: string;
  quantity: number;
  totalCompliments: number;
}

/* -------------------------------------------------------------------------- */
/*                                Notification                                */
/* -------------------------------------------------------------------------- */

export interface ComplimentNotificationPayload {
  senderId: string;
  receiverId: string;
  complimentId: string;
  message?: string | null;
}