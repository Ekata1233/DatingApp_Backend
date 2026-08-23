import { z } from "zod";

export const myPlansQuerySchema = z.object({
  period: z
    .enum([
      "TODAY",
      "TOMORROW",
      "WEEKEND",
    ])
    .optional(),

  activity: z
    .string()
    .trim()
    .min(1)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10),
});

export type MyPlansQuery =
  z.infer<typeof myPlansQuerySchema>;