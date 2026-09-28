import { NextFunction, Request, Response } from "express";
import { getMembershipInvoiceService, getMembershipPlanService, turnOffAutoRenewService } from "./membership.service";
import { AUTO_RENEW_CANCEL_REASONS } from "./membership.constants";

export const getMembershipPlanController = async (
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

    const data = await getMembershipPlanService(userId);

    return res.status(200).json({
      success: true,
      message: "Membership plan fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "GET MEMBERSHIP PLAN ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to fetch membership plan",
    });
  }
};


export const getMembershipInvoiceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    const { userPackageId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

     if (!userPackageId || Array.isArray(userPackageId)) {
      return res.status(400).json({
        success: false,
        message: "Valid User Package ID is required",
      });
    }

    const data = await getMembershipInvoiceService(
      userId,
      userPackageId,
    );

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "GET MEMBERSHIP INVOICE ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Failed to fetch invoice",
    });
  }
};

export const turnOffAutoRenewController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { reason } = req.body ?? {};

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "Cancellation reason is required",
      });
    }

    if (
      !AUTO_RENEW_CANCEL_REASONS.includes(
        reason as any
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid cancellation reason",
      });
    }

    const result =
      await turnOffAutoRenewService(
        userId,
        reason
      );

    return res.status(200).json({
      success: true,
      message:
        "Auto-renew has been turned off successfully.",
      data: result,
    });
  } catch (error: any) {
    if (
      error.message ===
      "ACTIVE_PACKAGE_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "No active subscription found.",
      });
    }

    if (
      error.message ===
      "AUTO_RENEW_ALREADY_DISABLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Auto-renew is already turned off.",
      });
    }

    next(error);
  }
};