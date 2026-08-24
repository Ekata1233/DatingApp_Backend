import { NextFunction, Request, Response } from "express";

import {
  createDraftDatePlan,
  updateDraftDatePlan,
  publishDatePlan,
  discoverDatePlan,
  skipDatePlan,
  requestToJoinDatePlan,
  getDatePlanRequests,
  approveDatePlanRequest,
  declineDatePlanRequest,
  topUpDatePlanPackage,
  getMyDatePlanRequests,
  cancelDatePlanRequest,
  testMatchScore,
  withdrawDatePlanRequest,
  getDatePlanHistory,
  updateDatePlanActivityService,
  cancelDatePlanService,
} from "./dateNow.service";
import { planIdParamSchema, updateDatePlanActivitySchema } from "./dateNow.validation";

export const createDraftController = async (
  req: Request,
  res: Response,
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

export const updateDraftController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const plan = await updateDraftDatePlan(
      req.params.id as string,
      userId,
      req.body,
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

export const publishPlanController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await publishDatePlan(req.params.id as string, userId);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const discoverDatePlanController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const plan = await discoverDatePlan(userId, req.query.filter as string);

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

export const skipDatePlanController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await skipDatePlan(userId, req.params.id as string);

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const requestToJoinController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const message = req.body?.message || undefined;
    const request = await requestToJoinDatePlan(
      userId,
      req.params.id as string,
      message,
    );

    res.json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDatePlanRequestsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const requests = await getDatePlanRequests(
      userId,
      req.params.planId as string,
    );

    res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const approveDatePlanRequestController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const request = await approveDatePlanRequest(
      userId,
      req.params.requestId as string,
    );

    res.json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const declineDatePlanRequestController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const request = await declineDatePlanRequest(
      userId,
      req.params.requestId as string,
    );

    res.json({
      success: true,
      data: request,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const topUpDatePlanPackageController = async (
  req: Request,
  res: Response,
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

    const { packageId } = req.body;

    const result = await topUpDatePlanPackage(userId, packageId);

    res.status(200).json({
      success: true,
      message: "Date plan package top-up successful",
      data: result,
    });
  } catch (error: any) {
    console.error("Top Up Date Plan Package Error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Failed to top up date plan package",
    });
  }
};

export const getMyDatePlanRequestsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const requests = await getMyDatePlanRequests(userId);

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelDatePlanRequestController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const request = await cancelDatePlanRequest(
      userId,
      req.params.planId as string,
    );

    return res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
      data: request,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const withdrawDatePlanRequestController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { requestId } = req.params;

    if (!requestId || Array.isArray(requestId)) {
      return res.status(400).json({
        success: false,
        message: "Valid Request ID is required",
      });
    }

    const result = await withdrawDatePlanRequest(
      requestId,
      userId
    );

    return res.status(200).json({
      success: true,
      message: result.message,
      data: {
        requestId: result.requestId,
      },
    });
  } catch (error: any) {
    console.error(
      "Withdraw date plan request error:",
      error
    );

    if (
      error.message === "Date plan request not found"
    ) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "You are not allowed to withdraw this request"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.startsWith(
        "Cannot withdraw a request"
      )
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const testMatchScoreController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: "targetUserId is required",
      });
    }

    const result = await testMatchScore(
      userId,
      targetUserId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getDatePlanHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const result =
      await getDatePlanHistory(
        userId,
        {
          page: Number(req.query.page) || 1,

          limit:
            Number(req.query.limit) || 10,

          status: req.query.status
            ? String(req.query.status)
            : "ALL",
        }
      );

    return res.status(200).json({
      success: true,

      message:
        "Date plan history fetched successfully",

      data: result.data,

      pagination:
        result.pagination,
    });
  } catch (error) {
    next(error);
  }
};




export const updateDatePlanActivityController = async (
  req: Request,
  res: Response,
) => {
  try {
    // Validate params
    const paramsResult = planIdParamSchema.safeParse(req.params);

    if (!paramsResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
        errors: paramsResult.error.flatten(),
      });
    }

    const { planId } = paramsResult.data;

    // Validate body
    const bodyResult = updateDatePlanActivitySchema.safeParse(req.body);

    if (!bodyResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid request body",
        errors: bodyResult.error.flatten(),
      });
    }

    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const updatedPlan = await updateDatePlanActivityService(
      userId,
      planId,
      bodyResult.data,
    );

    return res.status(200).json({
      success: true,
      message: "Date plan activity updated successfully",
      data: updatedPlan,
    });
  } catch (error: any) {
    console.error(
      "Update Date Plan Activity Error:",
      error,
    );

    if (error.message === "Date plan not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Invalid activity selected") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update date plan activity",
      error: error.message,
    });
  }
};

export const cancelDatePlanController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;
    const { planId } = req.params;

    if (!planId || Array.isArray(planId)) {
      return res.status(400).json({
        success: false,
        message: "Plan ID is required",
      });
    }

    const result = await cancelDatePlanService(userId, planId);

    return res.status(200).json({
      success: true,
      message: "Date plan cancelled successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Cancel date plan error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to cancel date plan",
    });
  }
};