import { Request, Response, NextFunction } from "express";

import { getComplimentBalanceService, getComplimentHistoryService, sendComplimentService } from "./compliment.service";
import { SendComplimentDto } from "./compliment.types";

export const sendComplimentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const senderId = (req as any).user.id;

    const body: SendComplimentDto = req.body;

    const result = await sendComplimentService(senderId, body);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export async function getComplimentBalanceController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.id;

    const balance = await getComplimentBalanceService(userId);

    return res.status(200).json({
      success: true,
      message: "Compliment balance fetched successfully.",
      data: balance,
    });
  } catch (error) {
    next(error);
  }
}

export const getComplimentHistoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user.id;

    const history = await getComplimentHistoryService(
      userId,
      req.query as any
    );

    return res.status(200).json({
      success: true,
      message: "Compliment history fetched successfully.",
      data: history.compliments,
      pagination: history.pagination,
    });
  } catch (error) {
    next(error);
  }
};