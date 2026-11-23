import { Request, Response } from "express";

import {
  verifyEventPartnerGstService,
  GstVerificationError,
} from "./gst-verification.service";
import { LpFintechConfigError } from "../../../../../config/lpfintech.config";

type AuthenticatedPartnerRequest = Request & {
  partnerId?: string;
  partner?: {
    id?: string;
    partnerId?: string;
  };
  user?: {
    id?: string;
    partnerId?: string;
  };
};

export const verifyEventPartnerGstController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthenticatedPartnerRequest;

    const partnerId =
      authReq.user?.id ??
      authReq.user?.partnerId ??
      authReq.partner?.id ??
      authReq.partner?.partnerId ??
      authReq.partnerId;

    if (!partnerId) {
      res.status(401).json({ success: false, message: "Unauthorized organizer" });
      return;
    }

    const { businessId, gstNumber } = req.body ?? {};

    if (typeof businessId !== "string" || !businessId.trim()) {
      res.status(400).json({ success: false, message: "businessId is required" });
      return;
    }

    if (typeof gstNumber !== "string" || !gstNumber.trim()) {
      res.status(400).json({ success: false, message: "gstNumber is required" });
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