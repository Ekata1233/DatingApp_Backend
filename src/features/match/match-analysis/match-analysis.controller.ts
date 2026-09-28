import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    getMatchAnalysisService,
} from "./match-analysis.service";

export const getMatchAnalysisController =
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const currentUserId =
                (req as any).user?.id;

            const targetUserId = req.params.userId as string;

            if (!currentUserId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            if (!targetUserId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Target user ID is required",
                });
            }

            const data =
                await getMatchAnalysisService(
                    currentUserId,
                    targetUserId
                );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            if (
                error.message ===
                "CANNOT_ANALYZE_OWN_PROFILE"
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "You cannot calculate match analysis with yourself",
                });
            }

            if (
                error.message ===
                "USER_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            if (
                error.message ===
                "TARGET_USER_NOT_FOUND"
            ) {
                return res.status(404).json({
                    success: false,
                    message:
                        "Target user not found",
                });
            }

            next(error);
        }
    };