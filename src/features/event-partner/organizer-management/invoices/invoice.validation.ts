import { z } from "zod";

// ==========================================
// CURRENT INDIA YEAR
// ==========================================

const getCurrentIndiaYear = () => {
  return Number(
    new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
};

// ==========================================
// GUEST INVOICE VALIDATION
// ==========================================

export const guestInvoiceQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),

  invoiceLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(6),

  search: z.string()
    .trim()
    .max(100)
    .optional(),
});

// ==========================================
// WELVORS INVOICE VALIDATION
// ==========================================

export const welvorsInvoiceQuerySchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12)
    .optional(),

  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2100)
    .default(getCurrentIndiaYear),
});

// ==========================================
// TAX REPORT VALIDATION
// ==========================================

export const organizerTaxReportQuerySchema = z.object({
  month: z.coerce
    .number()
    .int()
    .min(1)
    .max(12),

  year: z.coerce
    .number()
    .int()
    .min(2020)
    .max(2100)
    .default(getCurrentIndiaYear),
});

// ==========================================
// COMMON INVOICE VALIDATION
// ==========================================

export const invoiceQuerySchema =
  z.discriminatedUnion("type", [
    guestInvoiceQuerySchema.extend({
      type: z.literal("guest"),
    }),

    welvorsInvoiceQuerySchema.extend({
      type: z.literal("welvors"),
    }),

    organizerTaxReportQuerySchema.extend({
      type: z.literal("tax-report"),
    }),
  ]);

// ==========================================
// GUEST INVOICE DETAILS VALIDATION
// ==========================================

export const guestInvoiceDetailsParamsSchema =
  z.object({
    eventDateId: z.string()
      .uuid("Invalid event date ID"),
  });

export const guestInvoiceDetailsQuerySchema =
  z.object({
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
      .default(6),
  });

