import { CallbackStatus } from "@prisma/client";
import { z } from "zod";

export const createCallbackValidation = z.object({
  callbackDate: z
    .string()
    .min(1, "Callback date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Invalid callback date",
    }),

  timeWindow: z
    .string()
    .min(1, "Time window is required")
    .max(50, "Time window is too long"),

  topic: z
    .string()
    .max(100, "Topic is too long")
    .optional(),
});

export const updateCallbackStatusValidation = z.object({
  status: z.nativeEnum(CallbackStatus),

  agentName: z
    .string()
    .max(100)
    .optional(),

  callDuration: z
    .number()
    .int()
    .min(0)
    .optional(),

  resolutionNote: z
    .string()
    .optional(),
});

export const createFaqValidation = z.object({
  question: z
    .string()
    .min(1, "Question is required")
    .max(255),

  answer: z
    .string()
    .min(1, "Answer is required"),

  isActive: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});

export const updateFaqValidation = z.object({
  question: z
    .string()
    .min(1)
    .max(255)
    .optional(),

  answer: z
    .string()
    .min(1)
    .optional(),

  isActive: z.boolean().optional(),

  sortOrder: z
    .number()
    .int()
    .min(0)
    .optional(),
});