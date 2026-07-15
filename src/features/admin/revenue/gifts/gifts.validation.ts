
export const createGiftCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Category name must be at least 2 characters" })
      .max(100, { message: "Category name must not exceed 100 characters" }),
  }),
});

export const updateGiftCategorySchema = z.object({
  params: z.object({
    id: z.coerce
      .number()
      .int()
      .positive({ message: "Invalid category id" }),
  }),

  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Category name must be at least 2 characters" })
      .max(100, { message: "Category name must not exceed 100 characters" })
      .optional(),
  }),
});

export const giftCategoryIdSchema = z.object({
  params: z.object({
    id: z.coerce
      .number()
      .int()
      .positive({ message: "Invalid category id" }),
  }),
});

import { z } from "zod";

export const createGiftSchema = z.object({
  body: z.object({
    categoryId: z.number(),

    image: z
      .string()
      .url("Image must be valid URL"),

    name: z
      .string()
      .min(2)
      .max(100),

    coinCost: z
      .number()
      .int()
      .positive(),

    triggerLine: z
      .string()
      .max(90)
      .optional(),

    receiverLine: z
      .string()
      .max(90)
      .optional(),
  }),
});

export const updateGiftSchema = z.object({
  body: z.object({
    categoryId: z.number().optional(),

    image: z.string().url().optional(),

    name: z.string().min(2).max(100).optional(),

    coinCost: z.number().int().positive().optional(),

    triggerLine: z
      .string()
      .max(90)
      .optional(),

    receiverLine: z
      .string()
      .max(90)
      .optional(),

    isLive: z.boolean().optional(),
  }),
});