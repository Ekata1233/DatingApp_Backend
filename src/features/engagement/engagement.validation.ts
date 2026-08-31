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
         * What this engagement is targeting.
         *
         * null = whole profile
         * PHOTO = specific photo
         * PROMPT = specific prompt/about section
         */
        targetType: z
            .enum(["PHOTO", "PROMPT"])
            .nullable()
            .optional(),

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
                message: z.string().min(1).max(500).optional(),
                ideaId: z.string().uuid().optional(),
            })
            .optional(),

        gift: z
            .object({
                giftId: z
                    .coerce
                    .number()
                    .int("Gift ID must be an integer")
                    .positive("Gift ID must be greater than 0"),
                message: z.string().min(1).max(500),
            })
            .optional(),
    })
    /**
     * At least one engagement is required.
     */
    .refine(
        (data) =>
            data.rose ||
            data.compliment ||
            data.gift,
        {
            message: "At least one engagement is required",
        }
    )
    /**
     * Validate targetType + targetId combination.
     */
    .refine(
        (data) => {
            const targetType = data.targetType ?? null;
            const targetId = data.targetId ?? null;

            // No target = whole profile
            if (!targetType && !targetId) {
                return true;
            }

            // Target type requires target ID
            if (targetType && !targetId) {
                return false;
            }

            // Target ID requires target type
            if (targetId && !targetType) {
                return false;
            }

            return true;
        },
        {
            message: "Invalid target: targetType and targetId must be provided together",
            path: ["targetType"],
        }
    );

export type SendEngagementDTO = z.infer<
    typeof sendEngagementSchema
>;