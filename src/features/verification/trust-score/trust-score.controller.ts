import {
    Request,
    Response,
    NextFunction,
} from "express";

import {
    getPublicTrustScoreService,
} from "./trust-score.service";

export const getPublicTrustScoreController =
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const viewerUserId = (req as any).user?.id;

            const profileUserId = req.params.userId;

            if (!viewerUserId) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized",
                });
            }

            if (
                !profileUserId ||
                Array.isArray(profileUserId)
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID",
                });
            }

            // Here TypeScript knows profileUserId is string
            const data =
                await getPublicTrustScoreService(
                    viewerUserId,
                    profileUserId
                );

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (error: any) {
            if (error.message === "USER_NOT_FOUND") {
                return res.status(404).json({
                    success: false,
                    message: "User not found",
                });
            }

            next(error);
        }
    };