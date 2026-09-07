import { z } from "zod";

export const createUserReportValidation = z.object({
  reportedId: z.string().uuid("Invalid reported user id"),

  reason: z
    .string()
    .min(2, "Reason is required")
    .max(100, "Reason is too long"),

  description: z
    .string()
    .max(300, "Description cannot exceed 300 characters")
    .optional()
    .nullable(),
});