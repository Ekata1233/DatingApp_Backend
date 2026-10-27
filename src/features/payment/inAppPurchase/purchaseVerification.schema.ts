import { z } from "zod";

export const verifyPurchaseSchema = z.discriminatedUnion(
  "platform",
  [
    z.object({
      platform: z.literal("android"),
      priceId: z.string().uuid(),
      productId: z.string().min(1),
      purchaseToken: z.string().min(1),
      orderId: z.string().optional(),
    }),

    z.object({
      platform: z.literal("ios"),
      priceId: z.string().uuid(),
      productId: z.string().min(1),
      transactionId: z.string().min(1),
    }),
  ],
);

export type VerifyPurchaseInput =
  z.infer<typeof verifyPurchaseSchema>;