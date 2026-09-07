import {
  Request,
  Response,
} from "express";

import { getMyBalancesService } from "./myBalance.service";

export const getMyBalancesController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = (req as any).user.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const balances =
        await getMyBalancesService(userId);

      return res.status(200).json({
        success: true,
        message:
          "My balances fetched successfully",
        data: balances,
      });
    } catch (error: any) {
      console.error(
        "GET MY BALANCES ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,
        message:
          error.message ||
          "Failed to fetch my balances",
      });
    }
  };