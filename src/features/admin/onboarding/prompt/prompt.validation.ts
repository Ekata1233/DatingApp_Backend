import { z } from "zod";

export const createPromptCategoryValidation = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});

export const updatePromptCategoryValidation =
  createPromptCategoryValidation.partial();

export const createPromptValidation = z.object({
  categoryId: z.string().uuid(),
  question: z.string().min(2).max(255),
  priority: z.number().optional(),
  active: z.boolean().optional(),
  maxLength: z.number().min(50).max(500).optional(),
  visibility: z.enum([
    "EVERYONE",
    "PREMIUM_AND_ABOVE",
    "VIP_AND_ABOVE",
    "ELITE_ONLY",
  ]).optional(),
});

export const updatePromptValidation =
  createPromptValidation.partial();