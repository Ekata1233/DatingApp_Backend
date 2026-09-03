import { z } from "zod";

export const createPaymentOrderSchema = z.object({
  amount: z
    .coerce
    .number()
    .positive("Amount must be greater than 0"),

  currency: z
    .string()
    .length(3)
    .default("INR"),

  purpose: z
    .string()
    .min(1, "Payment purpose is required"),

  referenceId: z
    .string()
    .uuid()
    .optional(),

  packagePriceId: z
    .string()
    .uuid()
    .optional(),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z
    .string()
    .min(1),

  razorpay_payment_id: z
    .string()
    .min(1),

  razorpay_signature: z
    .string()
    .min(1),
});

export type CreatePaymentOrderDTO = z.infer<
  typeof createPaymentOrderSchema
>;

export type VerifyPaymentDTO = z.infer<
  typeof verifyPaymentSchema
>;