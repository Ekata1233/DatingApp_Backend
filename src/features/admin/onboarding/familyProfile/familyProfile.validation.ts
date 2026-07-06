import { z } from "zod";

export const createCategoryValidation = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(50),

  title: z
    .string()
    .trim()
    .min(2, "Title is required")
    .max(100),
});

export const updateCategoryValidation = z.object({
  code: z.string().trim().min(2).max(50).optional(),

  title: z.string().trim().min(2).max(100).optional(),
});

export const createMasterValueValidation = z.object({
  categoryId: z.number(),
  value: z
    .string()
    .trim()
    .min(1),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});


export const updateMasterValueValidation = z.object({
  categoryId: z.number().optional(),
  value: z.string().trim().min(1).optional(),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});

export const createFamilyIncomeValidation = z.object({
  title: z
    .string()
    .trim()
    .min(2),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});

export const updateFamilyIncomeValidation = z.object({
  title: z.string().trim().min(2).optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  priority: z.number().optional(),
  active: z.boolean().optional(),
});