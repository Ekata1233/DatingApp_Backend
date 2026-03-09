import { Request, Response } from "express";
import { birthDateValidation, nameValidation } from "./profile.validation";
import { updateBirthDateService, updateGenderService, updateInterestedInService, updateNameService, updateSexualOrientationService } from "./profile.service";

export const enterNameController = async (req: Request, res: Response) => {
  try {
    // now user.id is available
    const userId = (req as any).user.id;

    const { name } = nameValidation.parse(req.body);

    const user = await updateNameService(userId, name);

    return res.status(200).json({
      success: true,
      message: "Name saved successfully",
      onboarding_step: user.onboarding_step,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const enterBirthDateController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const validated = birthDateValidation.parse(req.body);

    const profile = await updateBirthDateService(userId, validated.birth_date);

    return res.status(200).json({
      success: true,
      message: "Birth date saved successfully",
      birth_date: profile.birth_date
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

//Gender
export const enterGenderController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { gender } = req.body;

    const profile = await updateGenderService(userId, gender);

    return res.status(200).json({
      success: true,
      message: "Gender saved successfully",
      gender: profile.gender,
      onboarding_step: 4
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

//Sexual_Orientation
export const enterSexualOrientationController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { sexual_orientation } = req.body;

    const profile = await updateSexualOrientationService(userId, sexual_orientation);

    return res.status(200).json({
      success: true,
      message: "Sexual orientation saved successfully",
      sexual_orientation: profile.sexual_orientation,
      onboarding_step: 5
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


//Interested In 
export const enterInterestedInController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const { interested_in } = req.body;

    const profile = await updateInterestedInService(userId, interested_in);

    return res.status(200).json({
      success: true,
      message: "Interested in preference saved successfully",
      interested_in: profile.interested_in,
      onboarding_step: 6
    });

  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};
