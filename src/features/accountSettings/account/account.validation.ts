// account.validation.ts

import { z } from "zod";

export const pauseAccountSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(255, "Reason cannot exceed 255 characters")
    .optional(),
});

export const deleteAccountSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(255, "Reason cannot exceed 255 characters")
    .optional(),
});