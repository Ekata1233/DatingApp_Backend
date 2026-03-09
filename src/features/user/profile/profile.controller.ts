import { Request, Response } from "express";
import { nameValidation } from "./profile.validation";
import { updateNameService } from "./profile.service";

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
