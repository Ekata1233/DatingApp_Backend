// account.controller.ts

import { Request, Response } from "express";

import {
  pauseAccountService,
  resumeAccountService,
  deleteAccountService,
} from "./account.service";

import {
  pauseAccountSchema,
} from "./account.validation";

export const pauseAccountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user!.id;

    const validation = pauseAccountSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0]?.message,
      });
    }

    const result = await pauseAccountService(
      userId,
      validation.data.reason,
    );

    return res.status(200).json({
      success: true,
      message: "Account paused successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Pause account error:", error);

    switch (error.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({
          success: false,
          message: "User not found",
        });

      case "ACCOUNT_ALREADY_PAUSED":
        return res.status(400).json({
          success: false,
          message: "Account is already paused",
        });

      case "ACCOUNT_DELETED":
        return res.status(400).json({
          success: false,
          message: "Deleted account cannot be paused",
        });

      default:
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
        });
    }
  }
};

export const resumeAccountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user!.id;

    const result = await resumeAccountService(userId);

    return res.status(200).json({
      success: true,
      message: "Account resumed successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Resume account error:", error);

    switch (error.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({
          success: false,
          message: "User not found",
        });

      case "ACCOUNT_ALREADY_ACTIVE":
        return res.status(400).json({
          success: false,
          message: "Account is already active",
        });

      case "ACCOUNT_DELETED":
        return res.status(400).json({
          success: false,
          message: "Deleted account cannot be resumed",
        });

      default:
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
        });
    }
  }
};

export const deleteAccountController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user!.id;

    const result = await deleteAccountService(userId);

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Delete account error:", error);

    switch (error.message) {
      case "USER_NOT_FOUND":
        return res.status(404).json({
          success: false,
          message: "User not found",
        });

      case "ACCOUNT_ALREADY_DELETED":
        return res.status(400).json({
          success: false,
          message: "Account is already deleted",
        });

      default:
        return res.status(500).json({
          success: false,
          message: "Something went wrong",
        });
    }
  }
};