import { z } from "zod";

export const sendGiftSchema = z.object({
  receiverId: z.uuid("Invalid receiver ID"),

  giftId: z
    .coerce
    .number()
    .int("Gift ID must be an integer")
    .positive("Gift ID must be greater than 0"),

  message: z
    .string()
    .trim()
    .max(150, "Message cannot exceed 150 characters")
    .optional(),

  targetType: z
    .enum([
      "ABOUT",
      "BASIC",
      "VIDEO",
      "PROMPT",
      "PHOTO",
      "CAREER",
      "INTEREST",
      "LIFESTYLE",
      "FAMILY",
    ])
    .nullable()
    .optional(),

     targetId: z.string().uuid().nullable().optional(),
});

export type SendGiftDTO = z.infer<typeof sendGiftSchema>;