import {
  Request,
  Response,
} from "express";
import { getPrivacySettingsService, updatePrivacySettingsService } from "./privacy-controls.service";



export const getPrivacySettingsController =
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
        await getPrivacySettingsService(
          userId,
        );

      return res.status(200).json({
        success: true,
        message:
          "Privacy settings fetched successfully",
        data,
      });
    } catch (error: any) {
      console.error(
        "Get privacy settings error:",
        error,
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch privacy settings",
      });
    }
  };

export const updatePrivacySettingsController =
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

      const {
        messagePermission,
        hideFromContacts,
        ghostMode,
      } = req.body;

      const data =
        await updatePrivacySettingsService(
          userId,
          {
            messagePermission,
            hideFromContacts,
            ghostMode,
          },
        );

      return res.status(200).json({
        success: true,
        message:
          "Privacy settings updated successfully",
        data,
      });
    } catch (error: any) {
      console.error(
        "Update privacy settings error:",
        error,
      );

      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Failed to update privacy settings",
      });
    }
  };