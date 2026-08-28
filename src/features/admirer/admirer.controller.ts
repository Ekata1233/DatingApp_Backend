import { Request, Response, NextFunction } from "express";
import * as admirerService from "./admirer.service";

export const getAdmirers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    const userId = (req as any).user.id;

    const type = req.query.type as "LIKE" | "ROSE";

    const direction =
      req.query.direction as "RECEIVED" | "SENT";

    const page = Number(req.query.page ?? 1);

    const limit = Number(req.query.limit ?? 20);

    const result = await admirerService.getAdmirers({
      userId,
      type,
      direction,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Admirers fetched successfully",
      ...result,
    });

  } catch (error) {
    next(error);
  }
};