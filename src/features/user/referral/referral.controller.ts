import { Request, Response } from "express";
import { validateReferralCode } from "./referral.service";

export const validateReferralController = async (
  req: Request,
  res: Response
) => {
  try {
    const { referralCode } = req.body;

    const result = await validateReferralCode(referralCode);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};