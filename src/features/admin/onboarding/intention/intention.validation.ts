import { z } from "zod";

export const createIntentionSchema = z.object({
  body: z.object({
    title: z.string().min(1),

    description: z.string().optional(),

    sortOrder: z.number().optional(),

    isActive: z.boolean().optional(),

    options: z.array(
      z.object({
        option: z.string(),

        optDescription: z.string().optional(),
      })
    ),
  }),
});