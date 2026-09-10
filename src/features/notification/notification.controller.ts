// Working on this file: src/features/notification/notification.repository.ts
import { NotificationType } from "@prisma/client";
import * as service from "./notification.service";
import { Request, Response } from "express";
import { NotificationCategory } from "./notification.types";

export const getUserNotifications = async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const data = await service.getNotifications(userId);

  res.json({ success: true, data });
};

export const markRead = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({
      success: false,
      message: "ID is required",
    });
    return;
  }

  if (typeof id !== "string") {
    res.status(400).json({
      success: false,
      message: "Invalid ID",
    });
    return;
  }

  const data = await service.markAsRead(id);

  res.json({ success: true, data });
};

export const saveDeviceToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { deviceToken } = req.body;

    if (!deviceToken || typeof deviceToken !== "string") {
      res.status(400).json({
        success: false,
        message: "Device token is required",
      });
      return;
    }

    // Get userId from your authenticated JWT
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await service.saveDeviceTokenService({
      userId,
      deviceToken,
    });

    res.status(200).json({
      success: true,
      message: "Device token saved successfully",
      data: {
        userId: user.id,
      },
    });
  } catch (error) {
    console.error("Save device token error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save device token",
    });
  }
};

export const getNotificationsController = async (
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

      const page =
        Number(
          req.query.page,
        ) || 1;

      const limit =
        Number(
          req.query.limit,
        ) || 20;

      const category =
        (
          req.query.category ??
          "ALL"
        )
          .toString()
          .toUpperCase() as NotificationCategory;

      const data =
        await service.getNotificationsService(
          userId,
          page,
          limit,
          category,
        );

      return res.status(200).json({
        success: true,
        message:
          "Notifications fetched successfully",
        data,
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message:
          error.message ??
          "Failed to fetch notifications",
      });
    }
  };

export const getUnreadNotificationCountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data =
      await service.getUnreadCountService(
        userId,
      );

    return res.status(200).json({
      success: true,
      message:
        "Unread notification count fetched successfully",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch unread notification count",
    });
  }
};

export const markNotificationReadController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    const notificationId =
      req.params.id as string;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data =
      await service.markNotificationReadService(
        userId,
        notificationId,
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to mark notification as read",
    });
  }
};

export const markAllNotificationsReadController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data =
      await service.markAllNotificationsReadService(
        userId,
      );

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read",
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Failed to mark notifications as read",
    });
  }
};

/**
 * GET notification setting
 */
export const getNotificationSettingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data =
      await service.getNotificationSettingService(userId);

    return res.status(200).json({
      success: true,
      message:
        "Notification setting fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "Get notification setting error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch notification setting",
    });
  }
};

/**
 * PATCH notification setting
 */
export const updateNotificationSettingController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { isEnabled } = req.body;

    if (typeof isEnabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "isEnabled is required and must be boolean",
      });
    }

    const data =
      await service.updateNotificationSettingService(
        userId,
        isEnabled,
      );

    return res.status(200).json({
      success: true,
      message: isEnabled
        ? "Notifications enabled successfully"
        : "Notifications muted successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "Update notification setting error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update notification setting",
    });
  }
};