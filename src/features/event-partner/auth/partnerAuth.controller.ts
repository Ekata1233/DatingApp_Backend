import { Request, Response } from "express";

import {
  sendPartnerOtp,
  verifyPartnerOtp,
  selectPartnerRole,
  partnerLogoutService,
} from "./partnerAuth.service";

import {
  PartnerRequest,
} from "../../../types/partnerAuth.types";

// ======================================================
// 1. SEND OTP
// ======================================================

export const sendOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      phoneNumber,
      type,
    } = req.body;

    const result = await sendPartnerOtp({
      phoneNumber,
      type,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to send OTP",
    });
  }
};

// ======================================================
// 2. VERIFY OTP
// ======================================================

export const verifyOtp = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      phoneNumber,
      otp,
      type,
      deviceToken,
    } = req.body;

    const result = await verifyPartnerOtp({
      phoneNumber,
      otp,
      type,
      deviceToken,
    });

    return res
      .status(result.is_register ? 201 : 200)
      .json({
        success: true,

        message: result.is_register
          ? "Registration successful"
          : "Login successful",

        data: result,
      });

  } catch (error) {
    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "OTP verification failed",
    });
  }
};

// ======================================================
// 3. SELECT ROLE
// ======================================================

export const selectRole = async (
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
      role,
      businessId,
    } = req.body;

    const result = await selectPartnerRole({
      partnerId: partner.id,

      sessionId: partner.sessionId,

      role,
      businessId,
    });

    return res.status(200).json({
      success: true,
      message: "Role selected successfully",
      data: result,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Failed to select role",
    });
  }
};

// ======================================================
// 4. LOGOUT
// ======================================================

export const logout = async (
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

    const result = await partnerLogoutService(
      partner.id,
      partner.sessionId,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    return res.status(400).json({
      success: false,

      message:
        error instanceof Error
          ? error.message
          : "Logout failed",
    });
  }
};