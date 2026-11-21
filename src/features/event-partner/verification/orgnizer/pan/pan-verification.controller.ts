
import { Request, Response } from "express";

import {
  verifyEventPartnerPanService,
  PanVerificationError,
} from "./pan-verification.service";

export const verifyEventPartnerPanController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
const partnerId = (req as any).partner?.id;
    const { businessId, panNumber, consent } = req.body;

    if (!partnerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized partner",
      });
      return;
    }

    if (
      typeof businessId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        businessId,
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Valid businessId is required",
      });
      return;
    }

    if (typeof panNumber !== "string") {
      res.status(400).json({
        success: false,
        message: "PAN number is required",
      });
      return;
    }

    const result = await verifyEventPartnerPanService({
      partnerId,
      businessId,
      panNumber,
      consent,
    });

    res.status(200).json({
      success: true,
      message: "PAN verified successfully",
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof PanVerificationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error("PAN verification error:", {
      name: error instanceof Error ? error.name : "Unknown",
    });

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
