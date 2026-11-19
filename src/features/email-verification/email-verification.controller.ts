import { Request, Response } from "express";

import {
  sendEmailOtpService,
  verifyEmailOtpService,
} from "./email-verification.service";

import {
  EmailVerificationError,
} from "./email-verification.types";

import {
  PartnerRequest,
} from "../../types/partnerAuth.types";

/* -------------------------------------------------------------------------- */
/*                              VALIDATE EMAIL                                */
/* -------------------------------------------------------------------------- */

const isValidEmail = (
  email: unknown,
): email is string => {
  return (
    typeof email === "string" &&
    email.trim().length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim(),
    )
  );
};

/* -------------------------------------------------------------------------- */
/*                              ERROR HANDLER                                 */
/* -------------------------------------------------------------------------- */

const handleEmailVerificationError = (
  error: unknown,
  res: Response,
) => {
  if (error instanceof EmailVerificationError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  const prismaError = error as {
    code?: string;
  };

  if (prismaError?.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "Email address is already in use",
    });
  }

  if (prismaError?.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Event partner not found",
    });
  }

 console.error("========== EMAIL VERIFICATION ERROR ==========");

if (error instanceof Error) {
  console.error("Error Name:", error.name);
  console.error("Error Message:", error.message);
} else {
  console.error("Unknown email verification error");
}

console.error("==============================================");

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

/* -------------------------------------------------------------------------- */
/*                              SEND EMAIL OTP                                */
/* -------------------------------------------------------------------------- */

export const sendEmailOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const partner = (req as PartnerRequest).partner;

    const partnerId = partner?.id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Partner authentication required",
      });
    }

    const { email } = req.body ?? {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    const result = await sendEmailOtpService(
      partnerId,
      {
        email: email.trim().toLowerCase(),
      },
    );

    return res.status(200).json({
      success: true,
      message: "Email OTP request submitted successfully",
      data: result,
    });

  } catch (error) {
    return handleEmailVerificationError(
      error,
      res,
    );
  }
};

/* -------------------------------------------------------------------------- */
/*                              VERIFY EMAIL OTP                              */
/* -------------------------------------------------------------------------- */

export const verifyEmailOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const partner = (req as PartnerRequest).partner;

    const partnerId = partner?.id;

    if (!partnerId) {
      return res.status(401).json({
        success: false,
        message: "Partner authentication required",
      });
    }

    const { email, otp } = req.body ?? {};

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Valid email address is required",
      });
    }

    if (
      typeof otp !== "string" ||
      !/^\d{6}$/.test(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid 6-digit OTP is required",
      });
    }

    const result = await verifyEmailOtpService(
      partnerId,
      {
        email: email.trim().toLowerCase(),
        otp,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: result,
    });

  } catch (error) {
    return handleEmailVerificationError(
      error,
      res,
    );
  }
};