import { z } from "zod";

export const globalAmountSchema = z.object({
  gst: z
    .number({
      error: "GST must be a number",
    })
    .min(0, "GST cannot be negative")
    .max(100, "GST cannot be greater than 100"),

  eventPlatformFee: z
    .number({
      error: "Event platform fee must be a number",
    })
    .min(0, "Event platform fee cannot be negative"),
    freeProfileLimit: z.number().int().min(0).default(0),
premiumProfileLimit: z.number().int().min(0).default(25),
vipProfileLimit: z.number().int().min(0).default(50),
vipEliteProfileLimit: z.number().int().min(0).default(100),
});