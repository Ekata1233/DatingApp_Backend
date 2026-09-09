import { z } from "zod";

export const unmatchSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Unmatch reason is required")
    .max(200, "Unmatch reason is too long"),

  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});