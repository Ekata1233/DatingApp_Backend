import { Request, Response, NextFunction } from "express";
import { createEducation, getAllEducation } from "./education.service";

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

    const data = await createEducation(req.body);

    res.status(201).json({
      success: true,
      message: "Education saved successfully",
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

    const data = await getAllEducation(flowType as string);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};