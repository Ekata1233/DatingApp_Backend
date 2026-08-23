import { Request, Response } from "express";

import { ZodError } from "zod";

import { myPlansQuerySchema } from "./datePlanMyPlans.Validation";

import {
  getMyPlansService,
  submitDatePlanAttendance,
  updateMetUser,
} from "./datePlanMyPlans.service";
import { DatePlanAttendanceStatus } from "@prisma/client";

export const getMyPlansController = async (req: Request, res: Response) => {
  try {
    /**
     * Get logged-in user
     */
    const userId = (req as any).user.id;

    /**
     * Validate query
     */
    const query = myPlansQuerySchema.parse(req.query);

    /**
     * Call service
     */
    const result = await getMyPlansService({
      userId,

      period: query.period,

      activity: query.activity,

      page: query.page,

      limit: query.limit,
    });

    /**
     * Success
     */
    return res.status(200).json(result);
  } catch (error: any) {
    /**
     * Zod validation error
     */
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,

        message: "Validation failed",

        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),

          message: issue.message,
        })),
      });
    }

    /**
     * Other error
     */
    return res.status(400).json({
      success: false,

      message: error.message ?? "Something went wrong",
    });
  }
};

export const submitDatePlanAttendanceController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const { planId } = req.params;
    const { attendanceStatus } = req.body;

    if (!planId || Array.isArray(planId)) {
      return res.status(400).json({
        success: false,
        message: "Valid planId is required",
      });
    }

    if (
      !attendanceStatus ||
      !Object.values(DatePlanAttendanceStatus).includes(attendanceStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid attendanceStatus is required",
        allowedValues: Object.values(DatePlanAttendanceStatus),
      });
    }

    const result = await submitDatePlanAttendance({
      userId,
      planId,
      attendanceStatus,
    });

    return res.status(201).json({
      success: true,
      message:
        attendanceStatus === "MET"
          ? "Attendance recorded successfully"
          : "No-show recorded successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("submitDatePlanAttendanceController error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to submit attendance",
    });
  }
};

export const updateMetUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    const { planId } = req.params;
    const { metUserId } = req.body;

    if (!planId || Array.isArray(planId)) {
      return res.status(400).json({
        success: false,
        message: "Valid planId is required",
      });
    }

    if (!metUserId) {
      return res.status(400).json({
        success: false,
        message: "metUserId is required",
      });
    }

    if (typeof metUserId !== "string") {
      return res.status(400).json({
        success: false,
        message: "metUserId must be a string",
      });
    }

    const result = await updateMetUser({
      userId,
      planId,
      metUserId,
    });

    return res.status(200).json({
      success: true,
      message: "Person you met updated successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("updateMetUserController error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to update person you met",
    });
  }
};
