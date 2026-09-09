import { Request, Response } from "express";
import { matchService } from "./match.service";
import { unmatchSchema } from "./match.validation";

export const matchController = {

    async unmatch(
        req: Request,
        res: Response
    ) {

        try {

            /**
             * ----------------------------------------
             * Authenticated user
             * ----------------------------------------
             */

            const currentUserId = (req as any).user?.id;

            if (!currentUserId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            /**
             * ----------------------------------------
             * Other user
             * ----------------------------------------
             */

            const { otherUserId } = req.params;

            if (typeof otherUserId !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid other user ID",
                });
            }

            /**
             * ----------------------------------------
             * Validate body
             * ----------------------------------------
             */

            const validation = unmatchSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request",
                    errors: validation.error.flatten(),
                });
            }

            const {
                reason,
                note,
            } = validation.data;

            /**
             * ----------------------------------------
             * Unmatch
             * ----------------------------------------
             */

            const result = await matchService.unmatch(
                currentUserId,
                otherUserId,
                reason,
                note
            );

            /**
             * ----------------------------------------
             * Response
             * ----------------------------------------
             */

            return res.status(200).json({
                success: true,
                message: "Unmatched successfully",
                data: result,
            });

        } catch (error: any) {

            console.error(
                "Unmatch error:",
                error
            );

            if (error.message === "MATCH_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "Active match not found",
                });
            }

            return res.status(500).json({
                success: false,
                message: "Failed to unmatch",
            });
        }
    },
};