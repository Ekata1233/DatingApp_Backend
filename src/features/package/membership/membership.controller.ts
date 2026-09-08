import { Request, Response } from "express";
import { getMembershipInvoiceService, getMembershipPlanService } from "./membership.service";

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