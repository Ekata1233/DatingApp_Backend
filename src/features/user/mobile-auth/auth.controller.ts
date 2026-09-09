import { Request, Response } from "express";
import { logoutService, sendOtp, verifyOtp } from "./auth.service";

export const sendOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { phoneNumber } = req.body;

    const result = await sendOtp({
      phoneNumber,
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.message || "Failed to send OTP",
    });
  }
};

export const verifyOtpController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      phoneNumber,
      otp,
      referralCode,
    } = req.body;

    const result = await verifyOtp({
      phoneNumber,
      otp,
      referralCode,
    });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message:
        error?.message || "OTP verification failed",
    });
  }
};

export const logoutController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const sessionId = (req as any).user.sessionId;

    const result = await logoutService(
      userId,
      sessionId,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Logout failed",
    });
  }
};