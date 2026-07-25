import { z } from "zod";

export const createEventSchema = z.object({
  body: z.object({
    eventType: z.enum([
      "SIGNATURE_MIXER",
      "SPEED_DATING",
      "WINE_TASTING",
      "SUPPER_CLUB",
      "BRUNCH_SOCIAL",
      "ROOFTOP_MIXER",
    ]),

    title: z
      .string()
      .trim()
      .min(3, "Title must be at least 3 characters")
      .max(120, "Title cannot exceed 120 characters"),

    status: z.enum([
      "DRAFT",
      "LIVE",
      "SOLD_OUT",
      "CANCELLED",
    ]),
  }),
});