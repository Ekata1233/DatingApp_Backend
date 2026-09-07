export type WalletTransactionFilter =
  | "ALL"
  | "IN"
  | "OUT";

export interface GetWalletQuery {
  filter?: WalletTransactionFilter;
  page?: number;
  limit?: number;
}