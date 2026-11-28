import { z } from "zod";

export const globalAmountSchema = z.object({
  gst: z
    .number({
      error: "GST must be a number",
    })
    .min(0, "GST cannot be negative")
    .max(100, "GST cannot be greater than 100"),

  gstTCS: z
    .number({
      error: "GST TCS must be a number",
    })
    .min(0, "GST TCS cannot be negative")
    .max(100, "GST TCS cannot be greater than 100"),

  tds: z
    .number({
      error: "TDS must be a number",
    })
    .min(0, "TDS cannot be negative")
    .max(100, "TDS cannot be greater than 100"),

  eventPlatformFee: z
    .number({
      error: "Event platform fee must be a number",
    })
    .min(0, "Event platform fee cannot be negative")
    .max(99999999.99, "Event platform fee exceeds maximum value"),

  welvorsCommission: z
    .number({
      error: "Welvors commission must be a number",
    })
    .min(0, "Welvors commission cannot be negative")
    .max(100, "Welvors commission cannot be greater than 100"),

  freeProfileLimit: z
    .number()
    .int()
    .min(0)
    .max(2147483647),

  premiumProfileLimit: z
    .number()
    .int()
    .min(0)
    .max(2147483647),

  vipProfileLimit: z
    .number()
    .int()
    .min(0)
    .max(2147483647),

  vipEliteProfileLimit: z
    .number()
    .int()
    .min(0)
    .max(2147483647),
});

export type GlobalAmountInput = z.infer<
  typeof globalAmountSchema
>;