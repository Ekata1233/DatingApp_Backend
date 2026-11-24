import { Request, Response } from "express";
import { getOrganizerStepName } from "../onboarding/organizer/organizer-progress";

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
      businessId,
    } = req.body;

    const result = await sendPartnerOtp({
      phoneNumber,
      type,
      businessId,
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
      businessId,
    } = req.body;

    const result = await verifyPartnerOtp({
      phoneNumber,
      otp,
      type,
      deviceToken,
      businessId,
    });

    const status = result.is_register ? 201 : 200;
    const message = result.is_register ? "Registration successful" : "Login successful";

    if (result.type === "HOST") {
      const { token, partner, pendingInvitations, hostData, ...data } = result;
      const Host_Data = (hostData ?? pendingInvitations ?? []).map(({ business, ...host }) => ({
        ...host,
        business: {
          id: business.id,
          legalName: business.legalName,
          brandName: business.brandName,
        },
      }));
      return res.status(status).json({
        success: true,
        message,
        token,
        Host_Data,
        data: { Organizer_Data: partner, ...data },
      });
    }

    const { token, partner, role, onboardingStep, onboardingCompleted, is_register, isOrganizer, isHost, nextScreen } = result;
    const { businesses, hosts, ...profile } = partner;

    return res.status(status).json({
      success: true,
      message,
      token,
      data: {
        partner: profile,
        role,
        onboardingStep,
        onboardingCompleted,
        is_register,
        isOrganizer,
        isHost,
        nextScreen,
        nextStep: result.role === "ORGANIZER" && !result.onboardingCompleted
          ? getOrganizerStepName(result.onboardingStep)
          : null,
      },
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
