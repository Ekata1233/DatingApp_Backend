import { Request, Response, NextFunction } from "express";
import {
  createRealYouMatters,
  getRealYouMatters,
  deleteRealYouMatters,
} from "./realYouMatters.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createRealYouMatters(req.body);
    res.status(201).json({ success: true, data });
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
    const data = await getRealYouMatters();
    res.json({ success: true, data });
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
    await deleteRealYouMatters();
    res.json({ success: true, message: "RealYouMatters deleted successfully" });
  } catch (error) {
    next(error);
  }
};
