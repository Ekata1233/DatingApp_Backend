import { Request, Response, NextFunction } from "express";
import {
  createRealYouMatters,
  getRealYouMatters,
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
    const { flowType } = req.query;

    const data = await getRealYouMatters(flowType as string);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};


