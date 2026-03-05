// gender.controller.ts
import { Request, Response, NextFunction } from "express";
import * as GenderService from "./gender.service";

// CREATE (with replace logic)
export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { title, options } = req.body;

    // Validation
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Options are required and must be a non-empty array",
      });
    }

    // Validate each option has label
    for (const option of options) {
      if (!option.label || typeof option.label !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Each option must have a valid label",
        });
      }
    }

    // This will delete old and create new
    const data = await GenderService.createGender({
      title,
      options,
    });

    console.log("gender : ", gender);

    res.status(201).json({
      success: true,
      message: "Gender created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

// GET ALL
export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await GenderService.getAllGenders();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE ALL
export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await GenderService.deleteAllGenders();

    res.status(200).json({
      success: true,
      message: "All gender data deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};