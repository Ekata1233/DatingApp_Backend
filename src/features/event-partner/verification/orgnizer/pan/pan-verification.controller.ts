
import { Response } from "express";
import type { PartnerRequest } from "../../../../../types/partnerAuth.types";

import {
  PanVerificationError,
} from "./pan-verification.service";
import { fetchOrganizerBusinessPan } from "../../../onboarding/organizer/organizer.service";

export const verifyEventPartnerPanController = async (
  req: PartnerRequest,
  res: Response,
): Promise<void> => {
  try {
    const partner = req.partner;
    if (!partner) {
      res.status(401).json({
        success: false,
        message: "Unauthorized partner",
      });
      return;
    }

    const { businessId = partner.businessId, panNumber, consent } = req.body ?? {};
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

    if (partner.role === "HOST" || (partner.businessId && partner.businessId !== businessId)) {
      res.status(403).json({
        success: false,
        message: "Organizer access is required for this business",
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

    const result = await fetchOrganizerBusinessPan({
      partnerId: partner.id,
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
