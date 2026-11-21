
import { Request, Response } from "express";

import {
  verifyEventPartnerGstService,
  GstVerificationError,
} from "./gst-verification.service";

export const verifyEventPartnerGstController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    // Must match partnerAuthMiddleware
    const partnerId = (req as any).partner?.id;

    const { businessId, gstNumber } = req.body ?? {};

    if (!partnerId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized partner",
      });
      return;
    }

    if (
      typeof businessId !== "string" ||
      !businessId.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Business ID is required",
      });
      return;
    }

    if (
      typeof gstNumber !== "string" ||
      !gstNumber.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "GST number is required",
      });
      return;
    }

    const result = await verifyEventPartnerGstService({
      partnerId,
      businessId: businessId.trim(),
      gstNumber: gstNumber.trim(),
    });

    res.status(200).json({
      success: true,
      message: result.verificationMessage,
      data: result,
    });
  } catch (error: unknown) {
    console.error("GST Verification Error:", error);

    if (error instanceof GstVerificationError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
