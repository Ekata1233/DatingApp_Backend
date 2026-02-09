import { Request, Response, NextFunction } from "express";
import {
  createInterestedIn,
  getAllInterestedIn,
} from "./interestedIn.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const data = await createInterestedIn(req.body);

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
    const data = await getAllInterestedIn();

    res.json({ success: true, cached: false, data });
  } catch (error) {
    next(error);
  }
};
