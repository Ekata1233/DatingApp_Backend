import { Request, Response } from "express";
import { sendOtp, verifyOtp } from "./auth.service";

export const sendOtpController = async (req: Request, res: Response) => {
  try {
    const { phoneNumber } = req.body;

    await sendOtp(phoneNumber);

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error: any) {
    console.error("Twilio Error:", error);

    res.status(500).json({
      message: error.message,
      code: error.code,
      moreInfo: error.moreInfo,
    });
  }
};

export const verifyOtpController = async (req: Request, res: Response) => {
  try {

    const { phoneNumber, otp, referralCode } = req.body;
    const user = await verifyOtp(phoneNumber, otp, referralCode);

    res.json({
      success: true,
      message: "Phone verified successfully",
      token: user.token
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid OTP" });
  }
};