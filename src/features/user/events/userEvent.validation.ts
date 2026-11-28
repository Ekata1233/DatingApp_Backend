import { z } from "zod";

export const getUserEventsQuerySchema = z
  .object({
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),
  })
  .strict();


  // ======================================================
// EVENT CHECKOUT VALIDATION
// ======================================================

export const calculateEventCheckoutSchema = z
  .object({
    eventDateId: z.string().uuid({
      message: "Invalid event date ID",
    }),

    tickets: z
      .array(
        z.object({
          ticketType: z.enum([
            "MEN",
            "WOMEN",
            "OTHER",
            "COUPLE",
          ]),

          quantity: z
            .number()
            .int()
            .min(1, "Minimum one ticket is required")
            .max(100),
        }).strict(),
      )
      .min(1, "Tickets are required")
      .max(4),

    couponCode: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ticketTypes = new Set<string>();

    data.tickets.forEach((ticket, index) => {
      if (ticketTypes.has(ticket.ticketType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,

          path: ["tickets", index, "ticketType"],

          message: "Duplicate ticket type is not allowed",
        });
      }

      ticketTypes.add(ticket.ticketType);
    });
  });

export const checkoutEventIdSchema = z.string().uuid({
  message: "Invalid event ID",
});

export const getUserEventIdSchema = z.string().uuid({
  message: "Invalid event ID",
});