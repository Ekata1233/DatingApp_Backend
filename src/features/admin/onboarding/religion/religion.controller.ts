import { Request, Response, NextFunction } from "express";
import {
  createReligionData,
  getAllReligionData,
} from "./religion.service";

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

    const data = await createReligionData(req.body);

    res.status(201).json({
      success: true,
      message: "Religion data saved successfully",
      data,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Title already exists for this flowType",
      });
    }

    next(error);
  }
};

// ✅ GET ALL
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { flowType } = req.query;

    const data = await getAllReligionData(flowType as string);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};