import { Request, Response, NextFunction } from "express";

import { z } from "zod";

import {
  purchasePackageService,
  purchasePackageWithWalletService,
} from "./package-purchase.service";
import { purchasePackageSchema } from "./package-purchase.validation";


export const purchasePackageWithWalletController = async (
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

    const parsed = purchasePackageSchema.safeParse({
      ...req.body,
      paymentMethod: req.body?.paymentMethod ?? "WALLET",
    });

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid request",
      });
    }

    const result = await purchasePackageService(userId, parsed.data);

    if (!result) {
      return res.status(500).json({
        success: false,
        message: "Package purchase could not be completed",
      });
    }

    return res.status(200).json({
      success: true,
      message: `${result.package.name} package purchased successfully`,
      data: result,
    });
  } catch (error: any) {
    const errorMessages: Record<string, string> = {
      USER_NOT_FOUND: "User not found",

      ACCOUNT_NOT_ACTIVE: "Your account is not active",

      PACKAGE_PRICE_NOT_FOUND:
        "Package or selected billing plan is unavailable",

      INVALID_PACKAGE_PRICE: "Invalid package price",

      INVALID_BILLING_CYCLE: "Invalid billing cycle",

      WALLET_NOT_FOUND: "Wallet not found",

      INSUFFICIENT_WALLET_BALANCE:
        "Insufficient wallet balance. Please add money to your wallet.",

      REWARD_CONFIG_NOT_FOUND: "Referral reward configuration not found",

      INVALID_PACKAGE_REWARD: "Invalid package referral reward configuration",

      REFERRER_WALLET_NOT_FOUND: "Referrer's wallet not found",
      LIFETIME_PACKAGE_ALREADY_OWNED: "You already own a lifetime package",

      PENDING_PACKAGE_ALREADY_EXISTS: "You already have a pending package",

      GOOGLE_PLAY_PRODUCT_NOT_FOUND: "Google Play product not found",

      GOOGLE_PLAY_PRODUCT_MISMATCH:
        "Google Play product does not match the selected package",

      GOOGLE_PLAY_PAYMENT_NOT_COMPLETED: "Google Play payment is not completed",

      GOOGLE_PLAY_ALREADY_PROCESSED:
        "This Google Play purchase has already been processed",

      GOOGLE_PLAY_ORDER_MISMATCH: "Google Play order verification failed",

      GOOGLE_PLAY_VERIFICATION_FAILED: "Unable to verify Google Play payment",

      GOOGLE_PLAY_NOT_CONFIGURED: "Google Play payment is not configured",
    };

    if (errorMessages[error.message]) {
      return res.status(400).json({
        success: false,
        message: errorMessages[error.message],
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "Purchase could not be completed due to another transaction. Please try again.",
      });
    }

    next(error);
  }
};
