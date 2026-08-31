import { z } from "zod";

export const sendEngagementSchema = z
    .object({
        receiverId: z.string().uuid(),

        rose: z
            .object({
                targetType: z.enum(["PHOTO", "PROMPT"]).nullable().optional(),
                targetId: z.string().uuid().nullable().optional(),
            })
            .optional(),

        compliment: z
            .object({
                message: z.string().min(1).max(500),
                ideaId: z.string().uuid().optional(),
                targetType: z.enum(["PHOTO", "PROMPT"]).nullable().optional(),
                targetId: z.string().uuid().nullable().optional(),
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
                targetType: z.enum(["PHOTO", "PROMPT"]).nullable().optional(),
                targetId: z.string().uuid().nullable().optional(),
            })
            .optional(),
    })
    .refine(
        (data) => data.rose || data.compliment || data.gift,
        {
            message: "At least one engagement is required",
        }
    )
    .refine(
        (data) => {
            if (!data.rose) return true;

            const targetType = data.rose.targetType ?? null;
            const targetId = data.rose.targetId ?? null;

            if (
                (targetType === "PHOTO" || targetType === "PROMPT") &&
                !targetId
            ) {
                return false;
            }

            if (
                targetId &&
                targetType !== "PHOTO" &&
                targetType !== "PROMPT"
            ) {
                return false;
            }

            return true;
        },
        {
            message: "Invalid rose target",
            path: ["rose"],
        }
    );

export type SendEngagementDTO = z.infer<
    typeof sendEngagementSchema
>;