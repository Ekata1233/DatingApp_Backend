import { Request, Response, NextFunction } from "express";

import { Prisma } from "@prisma/client";

import { walletBoostPurchaseSchema } from "./boost-purchase.validation";

import { purchaseBoostService, purchaseBoostWithWalletService } from "./boost-purchase.service";

export const purchaseBoostWithWalletController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const parsed = walletBoostPurchaseSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid purchase request",
      });
    }

    // const result =
    //   await purchaseBoostWithWalletService(
    //     userId,
    //     parsed.data
    //   );

    const result = await purchaseBoostService(userId, parsed.data);

    return res.status(200).json({
      success: true,
      message: "Boost purchased successfully",
      data: result,
    });
  } catch (error: any) {
    const errorMap: Record<string, string> = {
      BOOST_OPTION_NOT_FOUND: "Boost package not found",

      BOOST_OPTION_NOT_ACTIVE: "This Boost package is currently unavailable",

      INVALID_BOOST_COUNT: "Invalid Boost package",

      INVALID_BOOST_PRICE: "Invalid Boost package price",

      WALLET_NOT_FOUND: "Wallet not found",

      INSUFFICIENT_WALLET_BALANCE:
        "Insufficient wallet balance. Please add coins to continue.",

      GOOGLE_PLAY_NOT_CONFIGURED: "Google Play payment is not configured",

      GOOGLE_PLAY_PAYMENT_NOT_COMPLETED: "Google Play payment is not completed",

      GOOGLE_PLAY_PRODUCT_MISMATCH: "Invalid Google Play product",

      GOOGLE_PLAY_ALREADY_CONSUMED:
        "This Google Play purchase has already been consumed",

      GOOGLE_PLAY_ALREADY_PROCESSED:
        "This Google Play purchase has already been processed",

      GOOGLE_PLAY_ORDER_MISMATCH: "Google Play order verification failed",

      UNSUPPORTED_PURCHASE_QUANTITY:
        "Unsupported Google Play purchase quantity",
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
        message: "Wallet transaction conflict. Please try again.",
      });
    }

    next(error);
  }
};
