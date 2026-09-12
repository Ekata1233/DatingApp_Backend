import {
    Request,
    Response,
} from "express";

import * as service from "./userNotificationMute.service";


export const muteUserNotificationController = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = (req as any).user?.id;

        const mutedUserId = String(
            req.params.userId,
        );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!mutedUserId) {
            return res.status(400).json({
                success: false,
                message: "Muted user ID is required",
            });
        }

        const data =
            await service.muteUserNotificationService(
                userId,
                mutedUserId,
            );

        return res.status(200).json({
            success: true,
            message:
                "User notifications muted successfully",
            data,
        });
    } catch (error: any) {
        console.error(
            "Mute user notification error:",
            error,
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to mute user notifications",
        });
    }
};


export const unmuteUserNotificationController = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = (req as any).user?.id;

        const mutedUserId = String(
            req.params.userId,
        );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!mutedUserId) {
            return res.status(400).json({
                success: false,
                message: "Muted user ID is required",
            });
        }

        const data =
            await service.unmuteUserNotificationService(
                userId,
                mutedUserId,
            );

        return res.status(200).json({
            success: true,
            message:
                "User notifications unmuted successfully",
            data,
        });
    } catch (error: any) {
        console.error(
            "Unmute user notification error:",
            error,
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to unmute user notifications",
        });
    }
};


export const getMutedUsersController = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId =
            (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const data =
            await service.getMutedUsersService(
                userId,
            );

        return res.status(200).json({
            success: true,
            message:
                "Muted users fetched successfully",
            data,
        });
    } catch (error: any) {
        console.error(
            "Get muted users error:",
            error,
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch muted users",
        });
    }
};

export const getUserMuteStatusController = async (
    req: Request,
    res: Response,
) => {
    try {
        const userId = (req as any).user?.id;

        const targetUserId = String(
            req.params.userId,
        );

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const data =
            await service.getUserMuteStatusService(
                userId,
                targetUserId,
            );

        return res.status(200).json({
            success: true,
            message:
                "User mute status fetched successfully",
            data,
        });
    } catch (error: any) {
        console.error(
            "Get user mute status error:",
            error,
        );

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Failed to fetch user mute status",
        });
    }
};