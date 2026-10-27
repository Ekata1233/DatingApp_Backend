
import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Invalid slug format"
    )
    .max(100),
  description: z.string().trim().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).strict();

export const updateCategorySchema =
  createCategorySchema.partial();

export const createPromptSchema = z.object({
  categoryId: uuidSchema,
  message: z.string().trim().min(1),
  label: z.string().trim().max(100).nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
}).strict();

export const updatePromptSchema =
  createPromptSchema.partial();

export const userPromptQuerySchema = z.object({
  category: z.string().trim().optional(),
});

export const adminPromptQuerySchema = z.object({
  categoryId: uuidSchema.optional(),
  search: z.string().trim().optional(),
  cursor: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  isActive: z.enum(["true", "false"]).optional(),
});

export type CreateCategoryInput =
  z.infer<typeof createCategorySchema>;

export type UpdateCategoryInput =
  z.infer<typeof updateCategorySchema>;

export type CreatePromptInput =
  z.infer<typeof createPromptSchema>;

export type UpdatePromptInput =
  z.infer<typeof updatePromptSchema>;
