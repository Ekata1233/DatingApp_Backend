import { Request, Response, NextFunction } from "express";

import { sendComplimentService } from "./compliment.service";
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