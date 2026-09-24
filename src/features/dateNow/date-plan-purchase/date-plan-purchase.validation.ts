import { z } from "zod";

export const purchaseDatePlanWithWalletSchema =
  z.object({
    packageId: z
      .string()
      .uuid("Invalid Date Plan package ID"),
  });

export type PurchaseDatePlanWithWalletInput =
  z.infer<
    typeof purchaseDatePlanWithWalletSchema
  >;