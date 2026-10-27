// import { z } from "zod";

// export const sendEngagementSchema = z
//   .object({
//     receiverId: z.string().uuid(),

//     /**
//      * Engagement target.
//      *
//      * No targetType = whole profile
//      *
//      * PHOTO / PROMPT:
//      *   targetId is required
//      *
//      * Other target types:
//      *   targetId is not required
//      */
//     targetType: z
//       .enum([
//         "ABOUT",
//         "BASIC",
//         "VIDEO",
//         "PROMPT",
//         "PHOTO",
//         "CAREER",
//         "INTEREST",
//         "LIFESTYLE",
//         "FAMILY",
//       ])
//       .nullable()
//       .optional(),

//     /**
//      * Required only when:
//      * targetType = PHOTO or PROMPT
//      */
//     targetId: z
//       .string()
//       .uuid()
//       .nullable()
//       .optional(),

//     rose: z
//       .object({})
//       .optional(),

//     compliment: z
//       .object({
//         message: z
//           .string()
//           .min(1)
//           .max(500)
//           .optional(),

//         ideaId: z
//           .string()
//           .uuid()
//           .optional(),
//       })
//       .optional(),

//     gift: z
//       .object({
//         giftId: z
//           .coerce
//           .number()
//           .int("Gift ID must be an integer")
//           .positive("Gift ID must be greater than 0"),

//         message: z
//           .string()
//           .min(1)
//           .max(500).optional(),
//       })
//       .optional(),
//   })

//   /**
//    * At least one engagement is required.
//    */
//   .refine(
//     (data) =>
//       !!data.rose ||
//       !!data.compliment ||
//       !!data.gift,
//     {
//       message: "At least one engagement is required",
//     }
//   )

//   /**
//    * Target validation.
//    *
//    * PHOTO/PROMPT  -> targetId REQUIRED
//    * Other types   -> targetId NOT allowed/required
//    * No targetType -> targetId NOT allowed
//    */
//   .refine(
//     (data) => {
//       const targetType = data.targetType ?? null;
//       const targetId = data.targetId ?? null;

//       // No target = whole profile
//       if (!targetType) {
//         return !targetId;
//       }

//       // PHOTO and PROMPT require targetId
//       if (
//         targetType === "PHOTO" ||
//         targetType === "PROMPT"
//       ) {
//         return !!targetId;
//       }

//       // All other target types must NOT have targetId
//       return !targetId;
//     },
//     {
//       message:
//         "targetId is required only for PHOTO or PROMPT target types",
//       path: ["targetId"],
//     }
//   );

// export type SendEngagementDTO = z.infer<
//   typeof sendEngagementSchema
// >;

import { z } from "zod";

export const sendEngagementSchema = z
  .object({
    receiverId: z.string().uuid(),

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

    rose: z.object({}).optional(),

    compliment: z
      .object({
        ideaId: z.string().cuid().optional(),
        message: z.string().trim().min(1).max(500).optional(),
      })
      .refine((data) => !!data.ideaId || !!data.message, {
        message: "Either ideaId or message is required",
      })
      .optional(),

    gift: z
      .object({
        giftId: z.coerce
          .number()
          .int("Gift ID must be an integer")
          .positive("Gift ID must be greater than 0"),

        message: z.string().trim().min(1).max(500).optional(),
      })
      .optional(),
  })
  .refine((data) => !!data.rose || !!data.compliment || !!data.gift, {
    message: "At least one engagement is required",
  })
  .refine(
    (data) => {
      const targetType = data.targetType ?? null;
      const targetId = data.targetId ?? null;

      if (targetType === "PHOTO" || targetType === "PROMPT") {
        return !!targetId;
      }

      return !targetId;
    },
    {
      message: "targetId is required only for PHOTO or PROMPT target types",
      path: ["targetId"],
    },
  );

export type SendEngagementDTO = z.infer<typeof sendEngagementSchema>;
