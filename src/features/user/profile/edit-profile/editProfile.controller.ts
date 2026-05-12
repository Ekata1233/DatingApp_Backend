import { Request, Response } from "express";
import { updateBasicInfoService, updateBioService } from "./editProfile.service";
import { updateBasicInfoSchema, updateBioSchema } from "./editProfile.validation";
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
        message: "Unauthorized"
      });
    }

    
    const userId = (req as any).user.id;

    const validatedData = updateBasicInfoSchema.parse(req.body);

    const result = await updateBasicInfoService(
      userId,
      validatedData
    );

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
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
export const updateUserEduWork = async (
  req: Request,
  res: Response
) => {
  try {
   const userId = (req as any).user.id;

    const result = await userEduWorkService.updateUserEduWork(
      userId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "User education and work updated successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const updateQuestionAnswers =
  async (
    req: Request,
    res: Response
  ) => {

    try {

      const userId = req.user?.id;

      if (!userId) {

        return res.status(401).json({
          success: false,
          message: "Unauthorized"
        });

      }

      //-----------------------------------
      // VALIDATION
      //-----------------------------------

      const validatedData =
        updateQuestionAnswerSchema.parse(
          req.body
        );

      //-----------------------------------
      // SERVICE
      //-----------------------------------

      const result =
        await updateQuestionAnswersService(
          userId,
          validatedData
        );

      //-----------------------------------
      // RESPONSE
      //-----------------------------------

      return res.status(200).json({
        success: true,
        data: result
      });

    } catch (error: any) {

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Internal server error"
      });

    }

};