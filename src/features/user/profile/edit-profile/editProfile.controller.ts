import { NextFunction, Request, Response } from "express";
import { getEditProfileService, updateBasicInfoService, updateBioService } from "./editProfile.service";
import { updateBasicInfoSchema, updateBioSchema, updateEduWorkSchema, updateLocationSchema, updateUserPromptSchema } from "./editProfile.validation";
import * as userEduWorkService from "./editProfile.service";
import {
  updateQuestionAnswerSchema
} from "./editProfile.validation";

import {
  updateQuestionAnswersService
} from "./editProfile.service";

export const updateBasicInfo = async (
  req: Request,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = req.user.id;

    const validatedData =
      updateBasicInfoSchema.parse(req.body);

    const result =
      await updateBasicInfoService(
        userId,
        validatedData
      );

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

//aboutme
export const updateBio = async (
  req: Request,
  res: Response
) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    const userId = (req as any).user.id;


    const validatedData =
      updateBioSchema.parse(req.body);

    const result = await updateBioService(
      userId,
      validatedData.bio
    );

    return res.status(200).json({
      success: true,
      message: "Bio updated successfully",
      data: result
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

//-------------------------------USER EDUCATION AND WORK UPDATE-------------------------------
// export const updateUserEduWork = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//    const userId = (req as any).user.id;

//     const result = await userEduWorkService.updateUserEduWork(
//       userId,
//       req.body
//     );

//     return res.status(200).json({
//       success: true,
//       message: "User education and work updated successfully",
//       data: result,
//     });
//   } catch (error: any) {
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Internal server error",
//     });
//   }
// };

export const updateQuestionAnswers = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = (req as any).user.id;

    const body = updateQuestionAnswerSchema.parse(req.body);

    const result = await updateQuestionAnswersService(
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEduWork = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = (req as any).user.id;

    const body = updateEduWorkSchema.parse(req.body);

    const result = await userEduWorkService.updateEduWorkService(
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

export const updateUserPrompt = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user!.id;

    const body = updateUserPromptSchema.parse(req.body);

    const result = await userEduWorkService.updateUserPromptService(
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLocation = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const userId = (req as any).user.id;

    const body = updateLocationSchema.parse(req.body);

    const result = await userEduWorkService.updateLocationService(
      userId,
      body
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteUserPromptController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const { promptId } = req.params;

    if (typeof promptId !== "string") {
      throw new Error("Invalid promptId");
    }

    await userEduWorkService.deleteUserPromptService(userId, promptId);

    res.status(200).json({
      success: true,
      message: "Prompt deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export async function getEditProfileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.id;

    const profile = await getEditProfileService(userId);

    return res.status(200).json({
      success: true,
      message: "profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}