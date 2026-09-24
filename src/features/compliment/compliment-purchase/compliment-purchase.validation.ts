import { z } from "zod";

export const purchaseComplimentWithWalletSchema =
  z.object({
    packId: z
      .string()
      .uuid("Invalid Compliment pack ID"),
  });

export type PurchaseComplimentWithWalletInput =
  z.infer<
    typeof purchaseComplimentWithWalletSchema
  >;