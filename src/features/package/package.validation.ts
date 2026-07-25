import { z } from "zod";

export const activatePackageValidation = z.object({
  paymentId: z.string().uuid("Invalid payment ID format"),
});

export const checkFeatureAccessValidation = z.object({
  featureCode: z.string().min(1, "Feature code is required"),
});