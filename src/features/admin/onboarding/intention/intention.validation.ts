import { z } from "zod";

export const createIntentionSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required"),

    description: z.string().optional(),

    option: z.string().optional(),

    optDescription: z.string().optional(),

    sortOrder: z.number().optional(),

    isActive: z.boolean().optional(),
  }),
});

export const updateIntentionSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    option: z.string().optional(),
    optDescription: z.string().optional(),
    sortOrder: z.number().optional(),
    isActive: z.boolean().optional(),
  }),
});