// rose.validation.ts

import { z } from "zod";
import { RoseType } from "@prisma/client";
import { AppError } from "./AppError";

/* -------------------------------------------------------------------------- */
/*                               Send Rose Schema                             */
/* -------------------------------------------------------------------------- */

export const sendRoseSchema = z.object({
  receiverId: z.uuid({
    message: "Invalid receiver ID format",
  }),

  roseType: z.enum([RoseType.PURCHASED], {
    message: "Rose type must be PURCHASED",
  }),

  message: z
    .string()
    .trim()
    .min(1, "Message must be at least 1 character")
    .max(200, "Message must not exceed 200 characters")
    .optional()
    .nullable(),
});

/* -------------------------------------------------------------------------- */
/*                            Get History Query                               */
/* -------------------------------------------------------------------------- */

export const getHistoryQuerySchema = z.object({
  type: z
    .enum(["sent", "received"], {
      message: "Type must be sent or received",
    })
    .optional(),

  page: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(
      z
        .number()
        .int("Page must be an integer")
        .min(1, "Page must be at least 1")
        .optional()
    ),

  limit: z
    .string()
    .optional()
    .transform((value) => (value ? Number(value) : undefined))
    .pipe(
      z
        .number()
        .int("Limit must be an integer")
        .min(1, "Limit must be at least 1")
        .max(50, "Limit must not exceed 50")
        .optional()
    ),

  startDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "Start date must be a valid ISO 8601 date"
    )
    .transform((value) => (value ? new Date(value) : undefined)),

  endDate: z
    .string()
    .optional()
    .refine(
      (value) => !value || !Number.isNaN(Date.parse(value)),
      "End date must be a valid ISO 8601 date"
    )
    .transform((value) => (value ? new Date(value) : undefined)),
});

/* -------------------------------------------------------------------------- */
/*                        Add Purchased Roses Schema                           */
/* -------------------------------------------------------------------------- */

export const addPurchasedRosesSchema = z.object({
  amount: z
    .number()
    .int("Amount must be an integer")
    .positive("Amount must be a positive number")
    .min(1, "Amount must be at least 1"),
});

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SendRoseInput = z.infer<typeof sendRoseSchema>;
export type GetHistoryQueryInput = z.infer<typeof getHistoryQuerySchema>;
export type AddPurchasedRosesInput = z.infer<
  typeof addPurchasedRosesSchema
>;

/* -------------------------------------------------------------------------- */
/*                              Validation Helper                             */
/* -------------------------------------------------------------------------- */

export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown
): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new AppError(
        400,
        error.issues[0]?.message ?? "Validation failed",
        error.issues
      );
    }

    throw error;
  }
}