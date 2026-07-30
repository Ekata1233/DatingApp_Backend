// purchaseStore.validation.ts
import { z } from 'zod';

export const createPurchaseSchema = z.object({
    storeItemId: z.string()
        .uuid()
        .min(1, "Store item ID is required"),

    paymentMethod: z.enum(["WALLET", "PAYU"], {
        errorMap: () => ({ message: "Payment method must be either WALLET or PAYU" })
    })
});

// If you want to infer the TypeScript type
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;