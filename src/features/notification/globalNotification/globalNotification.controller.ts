import {
  Request,
  Response,
} from "express";

import * as service from "./globalNotification.service";


/**
 * GET notification settings
 */
export const getGlobalNotificationSettingController =
  async (
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
        await service.getGlobalNotificationSettingService(
          userId,
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification settings fetched successfully",
        data,
      });
    } catch (error: any) {
      console.error(
        "Get notification settings error:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch notification settings",
      });
    }
  };


/**
 * PATCH notification settings
 */
export const updateGlobalNotificationSettingController =
  async (
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
        await service.updateGlobalNotificationSettingService(
          userId,
          req.body,
        );

      return res.status(200).json({
        success: true,
        message:
          "Notification settings updated successfully",
        data,
      });
    } catch (error: any) {
      console.error(
        "Update notification settings error:",
        error,
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to update notification settings",
      });
    }
  };