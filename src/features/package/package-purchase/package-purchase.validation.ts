import { z } from "zod";

export const purchasePackageSchema = z.discriminatedUnion(
  "paymentMethod",
  [
    z.object({
      priceId: z.string().uuid(),
      paymentMethod: z.literal("WALLET"),
    }),

    z.object({
      priceId: z.string().uuid(),
      paymentMethod: z.literal("GOOGLE_PLAY"),
      productId: z.string().min(1),
      orderId: z.string().optional(),
      purchaseToken: z.string().min(1),
    }),
  ],
);

export type PurchasePackageInput = z.infer<
  typeof purchasePackageSchema
>;