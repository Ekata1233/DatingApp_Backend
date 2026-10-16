import { TransactionSource } from "@prisma/client";

export type WalletTransactionFilter =
  | "ALL"
  | "IN"
  | "OUT";

export interface GetWalletQuery {
  filter?: WalletTransactionFilter;
  source?: TransactionSource;
  page?: number;
  limit?: number;
}

export interface AddMoneyData {
  userId: string;
  amount: number;
}