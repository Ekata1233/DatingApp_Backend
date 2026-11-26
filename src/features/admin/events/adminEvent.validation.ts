import { z } from "zod";

export const getAllAdminEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type GetAllAdminEventsQuery = z.infer<
  typeof getAllAdminEventsQuerySchema
>;

// ======================================================
// ADMIN EVENT APPROVE / REJECT VALIDATION
// ======================================================

export const adminEventIdSchema = z.string().uuid({
  message: "Invalid event ID",
});

export const reviewAdminEventSchema = z
  .discriminatedUnion("status", [
    // APPROVE EVENT
    z.object({
      status: z.literal("APPROVED"),
    }).strict(),

    // REJECT EVENT
    z.object({
      status: z.literal("REJECTED"),

      rejectionReason: z
        .string()
        .trim()
        .min(1, "Rejection reason is required")
        .max(1000, "Rejection reason cannot exceed 1000 characters"),
    }).strict(),
  ]);

export type ReviewAdminEventInput = z.infer<
  typeof reviewAdminEventSchema
>;