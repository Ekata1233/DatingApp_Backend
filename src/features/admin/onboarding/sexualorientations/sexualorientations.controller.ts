import { Request, Response, NextFunction } from "express";
import {
  createSexualOrientation,
  getAllSexualOrientation,
  deleteSexualOrientation,
} from "./sexualorientations.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createSexualOrientation(req.body);
    res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await getAllSexualOrientation();
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await deleteSexualOrientation();
    res.json({
      success: true,
      message: "Sexual orientations deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
