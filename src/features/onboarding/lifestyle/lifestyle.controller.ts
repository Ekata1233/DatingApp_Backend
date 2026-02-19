import { Request, Response, NextFunction } from "express";
import {
  createLifestyle,
  getLifestyle,
  deleteLifestyle,
} from "./lifestyle.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createLifestyle(req.body);
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
    const data = await getLifestyle();
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
    await deleteLifestyle();
    res.json({ success: true, message: "Lifestyle deleted successfully" });
  } catch (error) {
    next(error);
  }
};
