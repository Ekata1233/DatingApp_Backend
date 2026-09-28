import {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getTrustVerificationStatusService,
} from "./verification.service";

export const getTrustVerificationStatusController =
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const data =
        await getTrustVerificationStatusService(
          userId
        );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error: any) {
      if (
        error.message ===
        "USER_NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      next(error);
    }
  };