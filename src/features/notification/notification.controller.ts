// Working on this file: src/features/notification/notification.repository.ts
import * as service from "./notification.service";
import { Request, Response } from "express";

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