import { z } from "zod";
import { EventDurationType } from "@prisma/client";

export const getHostEventsSchema = z.object({
  type: z
    .enum([
      "all",
      "ongoing",
      "upcoming",
      "past",
    ])
    .default("all"),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  eventDurationType: z
    .nativeEnum(EventDurationType)
    .optional(),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export type GetHostEventsQuery = z.infer<
  typeof getHostEventsSchema
>;