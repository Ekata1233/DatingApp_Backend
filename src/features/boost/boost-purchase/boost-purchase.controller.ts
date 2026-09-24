import {
  Request,
  Response,
  NextFunction,
} from "express";

import { Prisma } from "@prisma/client";

import {
  walletBoostPurchaseSchema,
} from "./boost-purchase.validation";

import {
  purchaseBoostWithWalletService,
} from "./boost-purchase.service";

export const purchaseBoostWithWalletController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = walletBoostPurchaseSchema.safeParse(
      req.body
    );

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message:
          parsed.error.issues[0]?.message ||
          "Invalid purchase request",
      });
    }

    const result =
      await purchaseBoostWithWalletService(
        userId,
        parsed.data
      );

    return res.status(200).json({
      success: true,
      message: "Boost purchased successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMap: Record<string, string> = {
      BOOST_OPTION_NOT_FOUND:
        "Boost package not found",

      BOOST_OPTION_NOT_ACTIVE:
        "This Boost package is currently unavailable",

      INVALID_BOOST_COUNT:
        "Invalid Boost package",

      INVALID_BOOST_PRICE:
        "Invalid Boost package price",

      WALLET_NOT_FOUND:
        "Wallet not found",

      INSUFFICIENT_WALLET_BALANCE:
        "Insufficient wallet balance. Please add coins to continue.",
    };

    if (errorMap[error.message]) {
      return res.status(400).json({
        success: false,
        message: errorMap[error.message],
      });
    }

    if (error?.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "Wallet transaction conflict. Please try again.",
      });
    }

    next(error);
  }
};