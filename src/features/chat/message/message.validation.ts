// src/modules/chat/message/message.validation.ts

import { z } from "zod";

export const createMessageSchema = z
  .object({
    conversationId: z
      .string()
      .uuid("Invalid conversation ID"),

    content: z
      .string()
      .trim()
      .max(
        5000,
        "Message cannot exceed 5000 characters"
      )
      .optional()
      .nullable(),

    messageType: z.enum([
      "TEXT",
      "IMAGE",
      "VIDEO",
      "AUDIO",
      "FILE",
    ]),

    mediaUrl: z
      .string()
      .url("Invalid media URL")
      .optional()
      .nullable(),

    replyToMessageId: z
      .string()
      .uuid("Invalid reply message ID")
      .optional()
      .nullable(),
  })
  .superRefine((data, ctx) => {
    /**
     * TEXT messages require content.
     */
    if (data.messageType === "TEXT") {
      if (!data.content?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["content"],
          message: "Text message content is required",
        });
      }
    }

    /**
     * Media messages require mediaUrl.
     */
    if (
      ["IMAGE", "VIDEO", "AUDIO", "FILE"].includes(
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
  conversationId: z
    .string()
    .uuid("Invalid conversation ID"),

  cursor: z
    .string()
    .uuid("Invalid cursor")
    .optional(),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(30),
});

export const getMessageSchema = z.object({
  messageId: z
    .string()
    .uuid("Invalid message ID"),
});

export const deleteMessageSchema = z.object({
  messageId: z
    .string()
    .uuid("Invalid message ID"),
});

export const markMessageReadSchema = z.object({
  messageId: z
    .string()
    .uuid("Invalid message ID"),
});

export const markMessagesReadSchema = z.object({
  conversationId: z
    .string()
    .uuid("Invalid conversation ID"),
});

export const markMessageDeliveredSchema = z.object({
  messageId: z
    .string()
    .uuid("Invalid message ID"),
});