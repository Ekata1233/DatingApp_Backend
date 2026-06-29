import { Request, Response } from "express";

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

export const discoverDatePlanController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const plan = await discoverDatePlan(
      userId,
      req.query.filter as string
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

export const skipDatePlanController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const result = await skipDatePlan(
      userId,
      req.params.id as string
    );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const requestToJoinController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const request = await requestToJoinDatePlan(
      userId,
      req.params.id as string,
      req.body.message
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

export const getDatePlanRequestsController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const requests =
      await getDatePlanRequests(
        userId,
        req.params.planId as string
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

export const approveDatePlanRequestController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const request =
      await approveDatePlanRequest(
        userId,
        req.params.requestId as string
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

export const declineDatePlanRequestController = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const request =
      await declineDatePlanRequest(
        userId,
        req.params.requestId as string
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
  res: Response
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
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const request = await cancelDatePlanRequest(
      userId,
      req.params.planId as string
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