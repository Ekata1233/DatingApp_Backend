import { Request, Response } from "express";
import { createOrUpdateDatePlanBoostService, getDatePlanBoostService } from "./datePlanBoost.service";




// =====================================================
// CREATE OR UPDATE
// =====================================================

export const createOrUpdateDatePlanBoostController = async (
  req: Request,
  res: Response,
) => {
  try {
    const {
      title,
      description,
      isActive,
      options,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (
      !options ||
      !Array.isArray(options) ||
      options.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "At least one boost option is required",
      });
    }

    const result =
      await createOrUpdateDatePlanBoostService({
        title,
        description,
        isActive,
        options,
      });

    return res.status(200).json({
      success: true,
      message: "Date plan boost saved successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(
      "Date Plan Boost Save Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong",
    });
  }
};


// =====================================================
// GET
// =====================================================

export const getDatePlanBoostController = async (
  req: Request,
  res: Response,
) => {
  try {
    const result =
      await getDatePlanBoostService();

    return res.status(200).json({
      success: true,
      message: "Date plan boost fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error(
      "Get Date Plan Boost Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Something went wrong",
    });
  }
};