import { Request, Response, NextFunction } from "express";
import {
  createWorkDetails,
  getAllWorkDetails,
} from "./workDetails.service";

// ✅ CREATE
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType } = req.body;

    if (!flowType) {
      return res.status(400).json({
        success: false,
        message: "flowType is required",
      });
    }

    const data = await createWorkDetails(req.body);

    res.status(201).json({
      success: true,
      message: "Work details saved successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// ✅ GET
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType } = req.query;

    const data = await getAllWorkDetails(flowType as string);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};