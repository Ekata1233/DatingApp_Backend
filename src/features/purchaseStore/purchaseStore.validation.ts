import { z } from "zod";

// Define the enum (matching your Prisma enum)
export enum PurchasePaymentMethod {
  PACKAGE = "PACKAGE",
  WALLET = "WALLET",
  PAYMENT_GATEWAY = "PAYMENT_GATEWAY",
}

// Create the Zod schema
export const createPurchaseSchema = z.object({
  storePackId: z.string().uuid(),

  paymentMethod: z.enum([
    PurchasePaymentMethod.PACKAGE,
    PurchasePaymentMethod.WALLET,
    PurchasePaymentMethod.PAYMENT_GATEWAY,
  ]),
});

// Optional: Infer the TypeScript type from the schema
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;