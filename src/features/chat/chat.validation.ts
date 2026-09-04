// src/modules/chat/chat.validation.ts

import { z } from "zod";

export const createConversationSchema = z.object({
  targetUserId: z.string().uuid("Invalid target user ID"),
});

export const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid("Invalid conversation ID"),

    content: z
      .string()
      .trim()
      .max(2000, "Message cannot exceed 2000 characters")
      .optional(),

    messageType: z.enum([
      "TEXT",
      "IMAGE",
      "VIDEO",
      "AUDIO",
    ]),

    mediaUrl: z
      .string()
      .url("Invalid media URL")
      .optional(),
  })
  .superRefine((data, ctx) => {
    /**
     * TEXT message must contain content
     */
    if (data.messageType === "TEXT") {
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Text message content is required",
        });
      }
    }

    /**
     * Media messages must contain mediaUrl
     */
    if (
      ["IMAGE", "VIDEO", "AUDIO"].includes(
        data.messageType
      )
    ) {
      if (!data.mediaUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["mediaUrl"],
          message: "Media URL is required",
        });
      }
    }
  });

export const getMessagesSchema = z.object({
  conversationId: z.string().uuid(),

  cursor: z.string().uuid().optional(),

  limit: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30),
type: z
    .enum([
      "all",
      "rose",
      "gift",
      "compliment",
      "date",
      "online",
      "event",
    ])
    .default("all"),
    
});

export const getConversationsSchema = z.object({
  cursor: z.string().uuid().optional(),

  limit: z.coerce
    .number()
    .min(1)
    .max(50)
    .default(20),

  type: z
    .enum([
      "all",
      "unread",
      "online",
      "nearby",
      "date_invite",
      "event",
      "gift",
    ])
    .default("all"),
});

export const markConversationReadSchema = z.object({
  conversationId: z.string().uuid(),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});