// user.controller.ts

import { Request, Response } from "express";
import { getUserDetailsService } from "./onboarding.service";

export const WELVORS_FLOWS = [
  "VERIFY_PHONE",
  "BASIC_INFO",
  "INTERESTED_IN",
  "LOOKING_FOR",
  "LIFESTYLE",
  "CAREER_AMBITION",
  "INTEREST",
  "PHOTOS",
  "STORY",
  "PROMPT",
  "LOCATION",
  "REVIEW_FINISH",
] as const;

export type WelvorsFlow = (typeof WELVORS_FLOWS)[number];

export const isValidWelvorsFlow = (
  type: string,
): type is WelvorsFlow => {
  return WELVORS_FLOWS.includes(type as WelvorsFlow);
};

export const getUserDetailsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. User ID not found.",
      });
    }

    const type = req.query.type as string | undefined;

    const userDetails = await getUserDetailsService(userId, type);

    return res.status(200).json({
      success: true,
      message: "User details fetched successfully",
      data: userDetails,
    });
  } catch (error: any) {
    console.error("Get User Details Error:", error);

    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (error.message === "Invalid onboarding type") {
      return res.status(400).json({
        success: false,
        message: "Invalid onboarding type",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user details",
    });
  }
};