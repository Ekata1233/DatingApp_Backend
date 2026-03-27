import { Request, Response } from "express";
import { profileValidation } from "./profile.validation";
import {
  updateProfileService,
  updateInterestedInService,
  updateReligionService,
  updateLookingForService,
  updateSexualOrientationService,
} from "./profile.service";

export const profileController = async (req: Request, res: Response) => {
  try {
    // now user.id is available
    const userId = (req as any).user.id;

    const { fullName, email, birth_date, height, gender } =
      profileValidation.parse(req.body);

    const user = await updateProfileService(
      userId,
      fullName,
      email,
      birth_date,
      height,
      gender,
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      onboarding_step: user.onboarding_step,
      next_step: user.next_step,
      data: user,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Interested In
export const enterInterestedInController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const { interested_in } = req.body;

    const profile = await updateInterestedInService(userId, interested_in);

    return res.status(200).json({
      success: true,
      message: "Interested in preference saved successfully",
      interested_in: profile.interested_in,
      onboarding_step: 6,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Religion
export const ReligionController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { religion, community } = req.body;

    const profile = await updateReligionService(userId, religion, community);

    return res.status(200).json({
      success: true,
      message: "Religion saved successfully",
      religion: profile.religion,
      community: profile.community,

      onboarding_step: 5,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Sexual_Orientation
export const enterSexualOrientationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const { sexual_orientation } = req.body;

    const profile = await updateSexualOrientationService(
      userId,
      sexual_orientation,
    );

    return res.status(200).json({
      success: true,
      message: "Sexual orientation saved successfully",
      sexual_orientation: profile.sexual_orientation,
      onboarding_step: 5,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

//Looking for
export const enterLookingForController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const { looking_for } = req.body;

    // ✅ Basic validation
    if (!looking_for || typeof looking_for !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid looking_for value",
      });
    }

    const user = await updateLookingForService(userId, looking_for);

    return res.status(200).json({
      success: true,
      message: "Relationship preference saved successfully",
      looking_for: user.looking_for,
      onboarding_step: user.onboarding_step,
      next_step: user.next_step,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};
