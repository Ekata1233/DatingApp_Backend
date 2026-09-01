import { Request, Response } from "express";
import { sendOtp, verifyOtp } from "./auth.service";

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