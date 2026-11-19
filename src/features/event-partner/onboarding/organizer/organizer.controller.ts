import { Request, Response } from "express";

import {
  PartnerRequest,
} from "../../../../types/partnerAuth.types";

import {
  getOrganizerAboutYouService,
  saveOrganizerAboutYouService,
} from "./organizer.service";

import {
  OrganizerOnboardingError,
} from "./organizer.types";

// ======================================================
// VALIDATE UUID
// ======================================================

const isValidUUID = (
  value: unknown,
): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
};

// ======================================================
// ERROR HANDLER
// ======================================================

const handleOrganizerError = (
  error: unknown,
  res: Response,
) => {
  if (error instanceof OrganizerOnboardingError) {
    return res.status(error.statusCode).json({
      success: false,

      message: error.message,
    });
  }

  console.error(
    "========== ORGANIZER ONBOARDING ERROR ==========",
  );

  if (error instanceof Error) {
    console.error("Error Name:", error.name);

    console.error("Error Message:", error.message);
  }

  console.error(
    "================================================",
  );

  return res.status(500).json({
    success: false,

    message: "Internal server error",
  });
};

// ======================================================
// 1. GET ORGANIZER ABOUT YOU
// ======================================================

export const getOrganizerAboutYouController = async (
  req: Request,
  res: Response,
) => {
  try {
    const partner =
      (req as PartnerRequest).partner;

    if (!partner) {
      return res.status(401).json({
        success: false,

        message: "Partner authentication required",
      });
    }

    const { businessId } = req.query;

    // Validate business ID.

    if (!isValidUUID(businessId)) {
      return res.status(400).json({
        success: false,

        message: "Valid business ID is required",
      });
    }

    // Prevent Host access.

    if (
      partner.role === "HOST" ||

      (
        partner.businessId &&
        partner.businessId !== businessId
      )
    ) {
      return res.status(403).json({
        success: false,

        message: "Organizer access required",
      });
    }

    const result =
      await getOrganizerAboutYouService(
        partner.id,

        partner.sessionId,

        businessId,
      );

    return res.status(200).json({
      success: true,

      message: "Organizer details fetched successfully",

      data: result,
    });

  } catch (error) {
    return handleOrganizerError(
      error,
      res,
    );
  }
};

// ======================================================
// 2. SAVE ORGANIZER ABOUT YOU
// ======================================================

export const saveOrganizerAboutYouController = async (
  req: Request,
  res: Response,
) => {
  try {
    const partner =
      (req as PartnerRequest).partner;

    if (!partner) {
      return res.status(401).json({
        success: false,

        message: "Partner authentication required",
      });
    }

    const {
      businessId,

      fullName,

      email,

      verificationConsent,

      whatsappUpdates,

      verificationDocumentHash,

      whatsappDocumentHash,

      action,
    } = req.body ?? {};

    // Validate business ID.

    if (!isValidUUID(businessId)) {
      return res.status(400).json({
        success: false,

        message: "Valid business ID is required",
      });
    }

    // Prevent Host access.

    if (
      partner.role === "HOST" ||

      (
        partner.businessId &&
        partner.businessId !== businessId
      )
    ) {
      return res.status(403).json({
        success: false,

        message: "Organizer access required",
      });
    }

    const result =
      await saveOrganizerAboutYouService(
        partner.id,

        partner.sessionId,

        {
          businessId,

          fullName,

          email,

          verificationConsent,

          whatsappUpdates,

          verificationDocumentHash,

          whatsappDocumentHash,

          action,
        },

        req.ip,

        req.get("user-agent"),
      );

    return res.status(200).json({
      success: true,

      message:
        action === "CONTINUE"
          ? "Step 1 completed successfully"
          : "Organizer details saved successfully",

      data: result,
    });

  } catch (error) {
    return handleOrganizerError(
      error,
      res,
    );
  }
};