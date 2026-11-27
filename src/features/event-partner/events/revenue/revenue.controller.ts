import { Request, Response, NextFunction } from "express";

import { calculateRevenueSchema } from "./revenue.validation";

import { calculateRevenueService } from "./revenue.service";

export const calculateRevenueController = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = calculateRevenueSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const result = calculateRevenueService(
      parsed.data
    );

    return res.status(200).json({
      success: true,
      message: "Event revenue calculated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};