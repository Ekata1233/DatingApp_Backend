import { z } from "zod";

export const createLanguageValidation = z.object({
  name: z.string().trim().min(2).max(50),
  priority: z.number().int().optional(),
  active: z.boolean().optional(),
});

export const updateLanguageValidation = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  priority: z.number().int().optional(),
  active: z.boolean().optional(),
});