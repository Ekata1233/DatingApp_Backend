import { Request, Response, NextFunction } from "express";
import * as IntentionService from "./intention.service";

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const data = await IntentionService.createIntention(req.body);

    res.json({
      success: true,
      message: "Saved Successfully",
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

    const data = await IntentionService.getAllIntentions();

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

    await IntentionService.deleteIntention();

    res.json({
      success: true,
      message: "Deleted Successfully",
    });

  } catch (error) {
    next(error);
  }
};