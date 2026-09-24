import { z } from "zod";

export const walletBoostPurchaseSchema = z.object({
  boostOptionId: z.string().uuid(
    "Invalid Boost Option ID"
  ),
});

export type WalletBoostPurchaseInput =
  z.infer<typeof walletBoostPurchaseSchema>;