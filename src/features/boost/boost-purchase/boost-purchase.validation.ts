// import { z } from "zod";

// export const walletBoostPurchaseSchema = z.object({
//   boostOptionId: z.string().uuid(
//     "Invalid Boost Option ID"
//   ),
// });

// export type WalletBoostPurchaseInput =
//   z.infer<typeof walletBoostPurchaseSchema>;

import { z } from "zod";

export const walletBoostPurchaseSchema =
  z.discriminatedUnion("paymentMethod", [
    z.object({
      boostOptionId: z.string().uuid(),
      paymentMethod: z.literal("WALLET"),
    }),

    z.object({
      boostOptionId: z.string().uuid(),
      paymentMethod: z.literal("GOOGLE_PLAY"),
      productId: z.string().min(1),
      orderId: z.string().optional(),
      purchaseToken: z.string().min(1),
    }),
  ]);

export type BoostPurchaseInput = z.infer<
  typeof walletBoostPurchaseSchema
>;