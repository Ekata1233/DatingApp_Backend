import { z } from "zod";

export const purchaseRoseWithWalletSchema = z.object({
  packId: z.string().uuid("Invalid Rose pack ID"),
});

export type PurchaseRoseWithWalletInput =
  z.infer<typeof purchaseRoseWithWalletSchema>;