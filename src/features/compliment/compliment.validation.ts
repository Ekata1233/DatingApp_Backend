import { z } from "zod";

/* -------------------------------------------------------------------------- */
/*                               Send Compliment                              */
/* -------------------------------------------------------------------------- */

export const sendComplimentSchema = z.object({
  receiverId: z.string().uuid({
    message: "Receiver ID must be a valid UUID",
  }),

  ideaId: z.string().min(1, {
    message: "Compliment idea is required",
  }).optional(),

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

  message: z
    .string()
    .trim()
    .max(140, {
      message: "Message cannot exceed 140 characters",
    })
    .nullable()
    .optional()
    .default(null),

     targetId: z.string().uuid().nullable().optional(),
});

/* -------------------------------------------------------------------------- */
/*                            Purchase Compliments                            */
/* -------------------------------------------------------------------------- */

export const purchaseComplimentSchema = z.object({
  quantity: z
    .number()
    .int({
      message: "Quantity must be a whole number",
    })
    .min(1, {
      message: "Quantity must be at least 1",
    }),

  paymentMethod: z.enum(["WALLET", "PAYMENT_GATEWAY"], {
    message: "Payment method must be either WALLET or PAYMENT_GATEWAY",
  }),
});

/* -------------------------------------------------------------------------- */
/*                              Pagination Query                              */
/* -------------------------------------------------------------------------- */

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/* -------------------------------------------------------------------------- */
/*                          Get Sent/Received History                         */
/* -------------------------------------------------------------------------- */

export const complimentHistorySchema = paginationSchema.extend({
  status: z
    .enum(["PENDING", "ACCEPTED", "REJECTED", "EXPIRED"])
    .optional(),
});

/* -------------------------------------------------------------------------- */
/*                         Admin Create Category                              */
/* -------------------------------------------------------------------------- */

export const createComplimentCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, {
      message: "Category name must be at least 2 characters",
    })
    .max(50, {
      message: "Category name cannot exceed 50 characters",
    }),

  sortOrder: z.coerce.number().int().min(0).default(0),
});

/* -------------------------------------------------------------------------- */
/*                          Admin Update Category                             */
/* -------------------------------------------------------------------------- */

export const updateComplimentCategorySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .optional(),

    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/* -------------------------------------------------------------------------- */
/*                            Admin Create Idea                               */
/* -------------------------------------------------------------------------- */

export const createComplimentIdeaSchema = z.object({
  categoryId: z.string().min(1, {
    message: "Category ID is required",
  }),

  text: z
    .string()
    .trim()
    .min(2, {
      message: "Text must be at least 2 characters",
    })
    .max(140, {
      message: "Text cannot exceed 140 characters",
    }),

  sortOrder: z.coerce.number().int().min(0).default(0),
});

/* -------------------------------------------------------------------------- */
/*                            Admin Update Idea                               */
/* -------------------------------------------------------------------------- */

export const updateComplimentIdeaSchema = z
  .object({
    categoryId: z.string().optional(),

    text: z
      .string()
      .trim()
      .min(2)
      .max(140)
      .optional(),

    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type SendComplimentInput = z.infer<typeof sendComplimentSchema>;
export type PurchaseComplimentInput = z.infer<
  typeof purchaseComplimentSchema
>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type ComplimentHistoryInput = z.infer<
  typeof complimentHistorySchema
>;
export type CreateComplimentCategoryInput = z.infer<
  typeof createComplimentCategorySchema
>;
export type UpdateComplimentCategoryInput = z.infer<
  typeof updateComplimentCategorySchema
>;
export type CreateComplimentIdeaInput = z.infer<
  typeof createComplimentIdeaSchema
>;
export type UpdateComplimentIdeaInput = z.infer<
  typeof updateComplimentIdeaSchema
>;