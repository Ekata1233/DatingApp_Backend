import { z } from "zod";

import {
  EventReactiveStatus,
} from "@prisma/client";

export const adminReactivationIdSchema = z
  .string()
  .uuid("Invalid reactivation ID");

export const adminReactivationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20),

    status: z
      .nativeEnum(EventReactiveStatus)
      .optional(),

    eventId: z.string().uuid().optional(),
  })
  .strict();

export const reviewReactivationSchema =
  z.discriminatedUnion("status", [
    z
      .object({
        status: z.literal("UNDER_REVIEW"),
      })
      .strict(),

    z
      .object({
        status: z.literal("APPROVED"),
      })
      .strict(),

    z
      .object({
        status: z.literal("REJECTED"),

        rejectionReason: z
          .string()
          .trim()
          .min(1, "Rejection reason is required")
          .max(1000),
      })
      .strict(),
  ]);

export type AdminReactivationQuery = z.infer<
  typeof adminReactivationQuerySchema
>;

export type ReviewReactivationInput = z.infer<
  typeof reviewReactivationSchema
>;