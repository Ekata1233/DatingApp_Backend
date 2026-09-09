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

//razorpay

import { PaymentPurpose } from "@prisma/client";


export const createPaymentsOrderSchema = z
  .object({
    amount: z.coerce.number().positive().optional(),

    currency: z
      .string()
      .length(3)
      .default("INR"),

    purpose: z.nativeEnum(PaymentPurpose),

    referenceId: z
      .string()
      .uuid()
      .optional(),

    packagePriceId: z
      .string()
      .uuid()
      .optional(),

    // ============================
    // EVENT BOOKING
    // ============================

    eventId: z
      .string()
      .uuid()
      .optional(),

    menTicketCount: z
      .coerce
      .number()
      .int()
      .min(0)
      .default(0),

    womenTicketCount: z
      .coerce
      .number()
      .int()
      .min(0)
      .default(0),

    otherTicketCount: z
      .coerce
      .number()
      .int()
      .min(0)
      .default(0),
  })
  .superRefine((data, ctx) => {
    if (
      data.purpose ===
      PaymentPurpose.EVENT_BOOKING
    ) {
      if (!data.eventId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventId"],
          message:
            "Event ID is required for event booking",
        });
      }

      const totalTickets =
        data.menTicketCount +
        data.womenTicketCount +
        data.otherTicketCount;

      if (totalTickets <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["menTicketCount"],
          message:
            "At least one ticket is required",
        });
      }
    }
  });

export const verifyPaymentsSchema = z.object({
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

export type CreatePaymentsOrderDTO =
  z.infer<
    typeof createPaymentsOrderSchema
  >;

export type VerifyPaymentsDTO =
  z.infer<
    typeof verifyPaymentsSchema
  >;

// export type CreatePaymentOrderDTO = z.infer<
//   typeof createPaymentOrderSchema
// >;

// export type VerifyPaymentDTO = z.infer<
//   typeof verifyPaymentSchema
// >;




