import { Response } from "express";
import type { PartnerRequest } from "../../../../../types/partnerAuth.types";

import {
  verifyEventPartnerGstService,
  GstVerificationError,
} from "./gst-verification.service";
import { LpFintechConfigError } from "../../../../../config/lpfintech.config";

export const verifyEventPartnerGstController = async (
  req: PartnerRequest,
  res: Response
): Promise<void> => {
  try {
    const partner = req.partner;
    if (!partner) {
      res.status(401).json({ success: false, message: "Unauthorized organizer" });
      return;
    }

    const { businessId = partner.businessId, gstNumber } = req.body ?? {};

    if (typeof businessId !== "string" || !businessId.trim()) {
      res.status(400).json({ success: false, message: "businessId is required" });
      return;
    }

    const selectedBusinessId = businessId.trim();
    if (
      partner.role === "HOST" ||
      (partner.businessId && partner.businessId !== selectedBusinessId)
    ) {
      res.status(403).json({ success: false, message: "Organizer access is required for this business" });
      return;
    }

    if (typeof gstNumber !== "string" || !gstNumber.trim()) {
      res.status(400).json({ success: false, message: "gstNumber is required" });
      return;
    }

    const result = await verifyEventPartnerGstService({
      partnerId: partner.id,
      businessId: selectedBusinessId,
      gstNumber: gstNumber.trim(),
    });

    res.status(200).json({
      success: true,
      message: result.verificationMessage,
      data: result,
    });
  } catch (error: unknown) {
    if (error instanceof GstVerificationError) {
      // Full provider detail stays in server logs; for 5xx the end user
      // gets a generic message, not LP Fintech internals.
      console.error(`GST Verification Error [${error.statusCode}]:`, error.message);

      res.status(error.statusCode).json({
        success: false,
        message:
          error.statusCode >= 500
            ? "GST verification service is temporarily unavailable. Please try again later."
            : error.message,
      });
      return;
    }

    if (error instanceof LpFintechConfigError) {
      console.error("GST Verification Config Error:", error.message);
      res.status(500).json({
        success: false,
        message: "GST verification is not configured",
      });
      return;
    }

    console.error("GST Verification Error:", error instanceof Error ? error.message : error);

    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
