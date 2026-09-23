import { Request, Response, NextFunction } from "express";

import {
  mobileEmploymentSchema,
  uanEmploymentSchema,
} from "./employment.validation";

import {
  verifyEmploymentService,
  getEmploymentStatusService,
  submitEmploymentVerificationService,
  getMyEmploymentVerificationService,
  getEmploymentVerificationDetailsAdminService,
  reviewEmploymentVerificationService,
} from "./employment.service";
interface EmploymentRequestFiles {
  employmentId?: EmploymentFile | EmploymentFile[];
  salarySlip?: EmploymentFile | EmploymentFile[];
  bankStatement?: EmploymentFile | EmploymentFile[];
}

const getFile = (
  file: EmploymentFile | EmploymentFile[] | undefined
): EmploymentFile | undefined => {
  return Array.isArray(file) ? file[0] : file;
};
// ============================================
// ERROR → HTTP MAPPING
// ============================================

const ERROR_MAP: Record<string, { status: number; message: string }> = {
  USER_NOT_FOUND: { status: 404, message: "User not found." },
  ACCOUNT_NOT_ACTIVE: { status: 403, message: "Your account is not active." },
  PHONE_VERIFICATION_REQUIRED: {
    status: 400,
    message: "Please verify your mobile number first.",
  },
  MOBILE_NUMBER_DOES_NOT_MATCH: {
    status: 400,
    message: "Mobile number does not match your registered mobile number.",
  },
  INVALID_MOBILE_NUMBER: {
    status: 400,
    message: "Please enter a valid mobile number.",
  },
  INVALID_UAN_NUMBER: {
    status: 400,
    message: "Please enter a valid 12-digit UAN.",
  },
  INVALID_UAN_FROM_PROVIDER: {
    status: 502,
    message: "The employment provider returned an invalid or masked UAN.",
  },
  EMPLOYMENT_VERIFICATION_LOCKED: {
    status: 403,
    message: "Employment verification is locked.",
  },
  EMPLOYMENT_RECORDS_NOT_AVAILABLE: {
    status: 502,
    message: "Employment records could not be processed.",
  },
  GRIDLINES_API_KEY_NOT_CONFIGURED: {
    status: 500,
    message: "Employment verification provider is not configured.",
  },
  GRIDLINES_INVALID_API_KEY: {
    status: 502,
    message: "Employment verification provider authentication failed.",
  },
  GRIDLINES_FORBIDDEN_ACCESS: {
    status: 502,
    message:
      "Employment verification is currently unavailable. Provider access is not enabled.",
  },
  GRIDLINES_ENDPOINT_NOT_FOUND: {
    status: 502,
    message: "Employment verification provider endpoint is unavailable.",
  },
  GRIDLINES_INTERNAL_SERVER_ERROR: {
    status: 502,
    message: "Employment verification provider encountered an internal error.",
  },
  GRIDLINES_SERVER_ERROR: {
    status: 502,
    message: "Employment verification provider is temporarily unavailable.",
  },
  GRIDLINES_REQUEST_TIMEOUT: {
    status: 504,
    message: "Employment verification request timed out. Please try again later.",
  },
  GRIDLINES_API_REQUEST_FAILED: {
    status: 502,
    message: "Unable to complete employment verification with the provider.",
  },
};

const handleEmploymentError = (error: unknown, res: Response) => {
  const errorMessage =
    error instanceof Error ? error.message : "UNKNOWN_ERROR";

  console.error("Employment Verification Error:", errorMessage);

  const mapped = ERROR_MAP[errorMessage];
  if (mapped) {
    return res.status(mapped.status).json({
      success: false,
      message: mapped.message,
      error: errorMessage,
    });
  }

  if (errorMessage.startsWith("GRIDLINES_UNEXPECTED_RESPONSE_")) {
    return res.status(502).json({
      success: false,
      message: "Unexpected response from employment verification provider.",
      error: "GRIDLINES_UNEXPECTED_RESPONSE",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Employment verification failed. Please try again.",
    error: "EMPLOYMENT_VERIFICATION_FAILED",
  });
};

// ============================================
// OPTION 1: MOBILE → UAN → LATEST EMPLOYMENT
// POST /employment/verify/mobile
// ============================================

export const verifyEmploymentByMobileController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const validation = mobileEmploymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten(),
      });
    }

    const result = await verifyEmploymentService({
      userId,
      method: "MOBILE",
      value: validation.data.mobile_number,
    });

    return res.status(200).json(result);
  } catch (error: unknown) {
    return handleEmploymentError(error, res);
  }
};

// ============================================
// OPTION 2: UAN → LATEST EMPLOYMENT
// POST /employment/verify/uan
// ============================================

export const verifyEmploymentByUANController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const validation = uanEmploymentSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request",
        errors: validation.error.flatten(),
      });
    }

    const result = await verifyEmploymentService({
      userId,
      method: "UAN",
      value: validation.data.uan,
    });

    return res.status(200).json(result);
  } catch (error: unknown) {
    return handleEmploymentError(error, res);
  }
};

// ============================================
// GET STATUS
// GET /employment/status
// ============================================

export const getEmploymentStatusController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const verification = await getEmploymentStatusService(userId);

    return res.status(200).json({
      success: true,
      message: "Employment verification status fetched successfully.",
      data: verification,
    });
  } catch (error: unknown) {
    return handleEmploymentError(error, res);
  }
};



//---------------------------------------------------------



export const submitEmploymentVerificationController = async (
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

    const parsed =
      employmentVerificationSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          parsed.error.issues[0]?.message ||
          "Invalid employment details",
        errors: parsed.error.flatten(),
      });
    }

    const files =
      req.files as EmploymentRequestFiles | undefined;

    const employmentId = getFile(files?.employmentId);
    const salarySlip = getFile(files?.salarySlip);
    const bankStatement = getFile(files?.bankStatement);

    if (!employmentId || !salarySlip || !bankStatement) {
      return res.status(400).json({
        success: false,
        message:
          "Employment ID, salary slip and six-month bank statement are required",
      });
    }

    const result =
      await submitEmploymentVerificationService(
        userId,
        parsed.data,
        {
          employmentId,
          salarySlip,
          bankStatement,
        }
      );

    return res.status(201).json({
      success: true,
      message:
        "Employment verification submitted successfully. Your documents are pending admin review.",
      data: result,
    });
  } catch (error: any) {
    if (
      error.message ===
        "EMPLOYMENT_VERIFICATION_ALREADY_EXISTS" ||
      error.message ===
        "PROFESSIONAL_VERIFICATION_ALREADY_VERIFIED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Your employment verification is already submitted or verified.",
      });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      error.message.startsWith("Invalid") ||
      error.message.includes("must be less than") ||
      error.message === "DOCUMENT_BUFFER_MISSING"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};


export const getMyEmploymentVerificationController = async (
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

    const result =
      await getMyEmploymentVerificationService(userId);

    return res.status(200).json({
      success: true,
      message: result
        ? "Employment verification fetched successfully"
        : "Employment verification not submitted",
      data: result ?? {
        status: "NOT_STARTED",
      },
    });
  } catch (error) {
    next(error);
  }
};


export const getEmploymentVerificationsAdminController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const status = req.query.status as
      | EmploymentVerificationStatus
      | undefined;

    if (
      status &&
      !Object.values(EmploymentVerificationStatus).includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification status",
      });
    }

    const result =
      await getEmploymentVerificationsAdminService(status);

    return res.status(200).json({
      success: true,
      message:
        "Employment verifications fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const getEmploymentVerificationDetailsAdminController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const employmentId = req.params.id as string;

      const parsed = employmentIdSchema.safeParse(
        employmentId
      );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid employment verification ID",
        });
      }

      const result =
        await getEmploymentVerificationDetailsAdminService(
          parsed.data
        );

      return res.status(200).json({
        success: true,
        message:
          "Employment verification details fetched successfully",
        data: result,
      });
    } catch (error: any) {
      if (
        error.message ===
        "EMPLOYMENT_VERIFICATION_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "Employment verification not found",
        });
      }

      next(error);
    }
  };

  
export const reviewEmploymentVerificationController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adminId = (req as any).user?.id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const employmentId = req.params.id as string;

    const parsedId =
      employmentIdSchema.safeParse(employmentId);

    if (!parsedId.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid employment verification ID",
      });
    }

    const parsed =
      employmentReviewSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          parsed.error.issues[0]?.message ||
          "Invalid review request",
      });
    }

    const result =
      await reviewEmploymentVerificationService(
        parsedId.data,
        adminId,
        parsed.data.action,
        parsed.data.rejectionReason
      );

    return res.status(200).json({
      success: true,
      message:
        parsed.data.action === "APPROVE"
          ? "Employment verification approved successfully"
          : "Employment verification rejected successfully",
      data: result,
    });
  } catch (error: any) {
    const errorStatus: Record<string, number> = {
      VERIFICATION_NOT_FOUND: 404,
      VERIFICATION_ALREADY_REVIEWED: 409,
      REJECTION_REASON_REQUIRED: 400,
    };

    if (errorStatus[error.message]) {
      return res.status(errorStatus[error.message]).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
};