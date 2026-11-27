// import { z } from "zod";

// export const createPaymentOrderSchema = z.object({
//   amount: z
//     .coerce
//     .number()
//     .positive("Amount must be greater than 0"),

//   currency: z
//     .string()
//     .length(3)
//     .default("INR"),

//   purpose: z
//     .string()
//     .min(1, "Payment purpose is required"),

//   referenceId: z
//     .string()
//     .uuid()
//     .optional(),

//   packagePriceId: z
//     .string()
//     .uuid()
//     .optional(),
// });

// export const verifyPaymentSchema = z.object({
//   razorpay_order_id: z
//     .string()
//     .min(1),

//   razorpay_payment_id: z
//     .string()
//     .min(1),

//   razorpay_signature: z
//     .string()
//     .min(1),
// });

// export type CreatePaymentOrderDTO = z.infer<
//   typeof createPaymentOrderSchema
// >;

// export type VerifyPaymentDTO = z.infer<
//   typeof verifyPaymentSchema
// >;

//razorpay

import { PaymentPurpose } from "@prisma/client";
import { z } from "zod";

// ============================================
// CREATE PAYMENT ORDER VALIDATION
// ============================================

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

    // ========================================
    // EVENT BOOKING
    // ========================================

    eventId: z.string().uuid().optional(),

    eventDateId: z.string().uuid().optional(),

    tickets: z
      .array(
        z.object({
          ticketType: z.enum([
            "MEN",
            "WOMEN",
            "OTHER",
            "COUPLE",
          ]),

          quantity: z.number().int().min(1).max(10),
        }).strict(),
      )
      .min(1)
      .max(4)
      .optional(),

    couponCode: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),
  })
  .superRefine((data, ctx) => {
    // ========================================
    // EVENT BOOKING VALIDATION
    // ========================================

    if (data.purpose === PaymentPurpose.EVENT_BOOKING) {
      if (!data.eventId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventId"],
          message: "Event ID is required for event booking",
        });
      }

      if (!data.eventDateId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eventDateId"],
          message: "Event date ID is required for event booking",
        });
      }

      if (data.currency !== "INR") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["currency"],
          message: "Only INR currency is supported for event booking",
        });
      }

      // ======================================
      // VALIDATE TICKETS
      // ======================================

      if (!data.tickets || data.tickets.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tickets"],
          message: "At least one ticket is required",
        });
      } else {
        const selectedTypes = new Set<string>();

        // ====================================
        // PREVENT DUPLICATE TICKET TYPES
        // ====================================

        for (const ticket of data.tickets) {
          if (selectedTypes.has(ticket.ticketType)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["tickets"],
              message: "Duplicate ticket type is not allowed",
            });
          }

          selectedTypes.add(ticket.ticketType);
        }

        // ====================================
        // VALIDATE TOTAL TICKET COUNT
        // ====================================

        const totalTickets = data.tickets.reduce(
          (total, ticket) => total + ticket.quantity,
          0,
        );

        if (totalTickets < 1 || totalTickets > 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tickets"],
            message: "Total ticket count must be between 1 and 10",
          });
        }

        // ====================================
        // VALIDATE COUPLE TICKET COMBINATION
        // ====================================

        if (
          selectedTypes.has("COUPLE") &&
          selectedTypes.size > 1
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["tickets"],
            message:
              "Couple tickets cannot be combined with individual tickets",
          });
        }
      }

      // ======================================
      // PREVENT CLIENT PRICE MANIPULATION
      // ======================================

      if (data.amount !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["amount"],
          message: "Event booking amount is calculated by the server",
        });
      }
    }
  });

// ============================================
// VERIFY PAYMENT VALIDATION
// EXISTING LOGIC - UNCHANGED
// ============================================

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

// ============================================
// TYPES
// ============================================

export type CreatePaymentsOrderDTO = z.infer<
  typeof createPaymentsOrderSchema
>;

export type VerifyPaymentsDTO = z.infer<
  typeof verifyPaymentsSchema
>;
