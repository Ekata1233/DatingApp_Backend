import { PayoutMethodType } from "@prisma/client";

export interface CreatePayoutMethodInput {
  type: PayoutMethodType;

  // BANK
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;

  // UPI
  upiId?: string;
}

export interface UpdatePayoutMethodInput {
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;

  upiId?: string;
}