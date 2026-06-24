import { Request, Response } from "express";

import {
  createDraftDatePlan,
  updateDraftDatePlan,
  publishDatePlan,
} from "./dateNow.service";


export const createDraftController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const { activityId } = req.body;

    const plan = await createDraftDatePlan(userId, activityId);

    res.status(201).json({
      success: true,
      message: "Draft date plan created successfully",
      data: plan,
    });
  } catch (error) {
    console.error("Create Draft Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create draft date plan",
    });
  }
};

export const updateDraftController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const plan = await updateDraftDatePlan(
      req.params.id as string,
      userId,
      req.body
    );

    res.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const publishPlanController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const result = await publishDatePlan(
      req.params.id as string,
      userId
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};