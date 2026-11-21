import { Request, Response } from "express";

import {
  PartnerRequest,
} from "../../../../types/partnerAuth.types";

import {
  getOrganizerAboutYouService,
  saveOrganizerAboutYouService,
  verifyEventPartnerPanService,
} from "./organizer.service";

import {
  OrganizerOnboardingError,
} from "./organizer.types";
import { PanVerificationError } from "./organizer.helper";

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


// ======================================================
// PAN VERIFY
// ======================================================
export const verifyEventPartnerPanController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const partnerId = (req as any).partner.id;

    const {
      businessId,
      panNumber,
      consent,
    } = req.body;

    const result = await verifyEventPartnerPanService({
      partnerId,
      businessId,
      panNumber,
      consent,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: unknown) {
    console.error("PAN Verification Error:", error);

    if (error instanceof PanVerificationError) {
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

export const initPartnerGovernmentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const partnerId = (req as any).user?.id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      businessId,
      documentType,
      consent,
    } = req.body ?? {};

    if (
      typeof businessId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        businessId,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid businessId is required",
      });
    }

    if (documentType !== "AADHAAR") {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
        allowedTypes: ["AADHAAR"],
      });
    }

    if (consent !== true) {
      return res.status(400).json({
        success: false,
        message: "Verification consent is required",
      });
    }

    const result = await initPartnerGovernmentIdService({
      partnerId,
      businessId,
      documentType,
      consent,
    });

    return res.status(200).json({
      success: true,
      message: "DigiLocker authorization URL generated",
      data: result,
    });
  } catch (error) {
    if (error instanceof PartnerGovernmentIdError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};

/* -------------------------------------------------------------------------- */
/*                         COMPLETE CONTROLLER                                */
/* -------------------------------------------------------------------------- */

export const completePartnerGovernmentIdController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const partnerId = (req as any).user?.id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      businessId,
      attemptId,
    } = req.body ?? {};

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (
      typeof businessId !== "string" ||
      !uuidRegex.test(businessId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid businessId is required",
      });
    }

    if (
      typeof attemptId !== "string" ||
      !uuidRegex.test(attemptId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid attemptId is required",
      });
    }

    const result = await completePartnerGovernmentIdService({
      partnerId,
      businessId,
      attemptId,
    });

    return res.status(200).json({
      success: true,
      message: result.message ?? "Government ID verification processed",
      data: result,
    });
  } catch (error) {
    if (error instanceof PartnerGovernmentIdError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  }
};