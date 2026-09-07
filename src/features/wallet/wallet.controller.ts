import {
  Request,
  Response,
} from "express";

import { getMyWalletService } from "./wallet.service";

export const getMyWalletController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId = (req as any).user.id;

      const filter = req.query.filter
        ? String(req.query.filter)
        : "ALL";

      const page = req.query.page
        ? Number(req.query.page)
        : 1;

      const limit = req.query.limit
        ? Number(req.query.limit)
        : 20;

      const result =
        await getMyWalletService(
          userId,
          {
            filter: filter as any,
            page,
            limit,
          },
        );

      return res.status(200).json({
        success: true,

        message:
          "Wallet fetched successfully",

        data: result,
      });
    } catch (error: any) {
      console.error(
        "GET MY WALLET ERROR:",
        error,
      );

      return res.status(500).json({
        success: false,

        message:
          error.message ||
          "Failed to fetch wallet",
      });
    }
  };