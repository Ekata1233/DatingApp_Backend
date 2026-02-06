import { Request, Response, NextFunction } from "express";
import {
  getInterestedInCache,
  setInterestedInCache,
  clearInterestedInCache,
} from "./interestedIn.cache";
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
    await clearInterestedInCache();

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
    const cached = await getInterestedInCache();

    if (cached) {
      return res.json({ success: true, cached: true, data: cached });
    }

    const data = await getAllInterestedIn();
    await setInterestedInCache(data);

    res.json({ success: true, cached: false, data });
  } catch (error) {
    next(error);
  }
};
