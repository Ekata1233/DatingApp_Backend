import { z } from "zod";

export const guestListParamsSchema = z.object({
  eventId: z.string().uuid("Invalid event ID"),
});

export const guestListQuerySchema = z.object({
  eventDateId: z
    .string()
    .uuid("Invalid event date ID"),

  type: z
    .enum([
      "all",
      "checked_in",
      "not_arrived",
      "cancelled",
    ])
    .default("all"),

  search: z
    .string()
    .trim()
    .max(100)
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
    .max(100)
    .default(20),
});

export type GuestListQuery = z.infer<
  typeof guestListQuerySchema
>;