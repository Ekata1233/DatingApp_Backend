// import { z } from "zod";

// export const sendEngagementSchema = z
//     .object({
//         receiverId: z.string().uuid(),
// targetType: z.enum(["PHOTO", "PROMPT"]).nullable().optional(),
//                 targetId: z.string().uuid().nullable().optional(),
//         rose: z
//             .object({

//             })
//             .optional(),

//         compliment: z
//             .object({
//                 message: z.string().min(1).max(500),
//                 ideaId: z.string().uuid().optional(),
//             })
//             .optional(),

//         gift: z
//             .object({
//                 giftId: z
//                     .coerce
//                     .number()
//                     .int("Gift ID must be an integer")
//                     .positive("Gift ID must be greater than 0"),
//                 message: z.string().min(1).max(500),
//             })
//             .optional(),
//     })
//     .refine(
//         (data) => data.rose || data.compliment || data.gift,
//         {
//             message: "At least one engagement is required",
//         }
//     )
//     .refine(
//         (data) => {
//             if (!data.rose) return true;

//             const targetType = data.rose.targetType ?? null;
//             const targetId = data.rose.targetId ?? null;

//             if (
//                 (targetType === "PHOTO" || targetType === "PROMPT") &&
//                 !targetId
//             ) {
//                 return false;
//             }

//             if (
//                 targetId &&
//                 targetType !== "PHOTO" &&
//                 targetType !== "PROMPT"
//             ) {
//                 return false;
//             }

//             return true;
//         },
//         {
//             message: "Invalid rose target",
//             path: ["rose"],
//         }
//     );

// export type SendEngagementDTO = z.infer<
//     typeof sendEngagementSchema
// >;

import { z } from "zod";

export const sendEngagementSchema = z
  .object({
    receiverId: z.string().uuid(),

    /**
     * Engagement target.
     *
     * No targetType = whole profile
     *
     * PHOTO / PROMPT:
     *   targetId is required
     *
     * Other target types:
     *   targetId is not required
     */
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

    /**
     * Required only when:
     * targetType = PHOTO or PROMPT
     */
    targetId: z
      .string()
      .uuid()
      .nullable()
      .optional(),

    rose: z
      .object({})
      .optional(),

    compliment: z
      .object({
        message: z
          .string()
          .min(1)
          .max(500)
          .optional(),

        ideaId: z
          .string()
          .uuid()
          .optional(),
      })
      .optional(),

    gift: z
      .object({
        giftId: z
          .coerce
          .number()
          .int("Gift ID must be an integer")
          .positive("Gift ID must be greater than 0"),

        message: z
          .string()
          .min(1)
          .max(500).optional(),
      })
      .optional(),
  })

  /**
   * At least one engagement is required.
   */
  .refine(
    (data) =>
      !!data.rose ||
      !!data.compliment ||
      !!data.gift,
    {
      message: "At least one engagement is required",
    }
  )

  /**
   * Target validation.
   *
   * PHOTO/PROMPT  -> targetId REQUIRED
   * Other types   -> targetId NOT allowed/required
   * No targetType -> targetId NOT allowed
   */
  .refine(
    (data) => {
      const targetType = data.targetType ?? null;
      const targetId = data.targetId ?? null;

      // No target = whole profile
      if (!targetType) {
        return !targetId;
      }

      // PHOTO and PROMPT require targetId
      if (
        targetType === "PHOTO" ||
        targetType === "PROMPT"
      ) {
        return !!targetId;
      }

      // All other target types must NOT have targetId
      return !targetId;
    },
    {
      message:
        "targetId is required only for PHOTO or PROMPT target types",
      path: ["targetId"],
    }
  );

export type SendEngagementDTO = z.infer<
  typeof sendEngagementSchema
>;