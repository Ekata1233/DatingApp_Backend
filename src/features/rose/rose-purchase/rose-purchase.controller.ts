import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  purchaseRoseWithWalletSchema,
} from "./rose-purchase.validation";

import {
  purchaseRoseWithWalletService,
} from "./rose-purchase.service";

export const purchaseRoseWithWalletController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {

    // 1. Get authenticated user

    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 2. Validate request body

    const parsed =
      purchaseRoseWithWalletSchema.safeParse(
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

    // 3. Purchase Roses

    const result =
      await purchaseRoseWithWalletService(
        userId,
        parsed.data.packId
      );

    // 4. Success response

    return res.status(200).json({
      success: true,

      message:
        `${result.roses.purchased} Roses purchased successfully!`,

      data: result,
    });

  } catch (error: any) {

    const errorMessages: Record<string, string> = {
      USER_NOT_FOUND:
        "User not found",

      ACCOUNT_NOT_ACTIVE:
        "Your account is not active",

      ROSE_PACK_NOT_FOUND:
        "Rose pack not found or unavailable",

      INVALID_ROSE_PACK:
        "Invalid Rose pack configuration",

      WALLET_NOT_FOUND:
        "Wallet not found",

      INSUFFICIENT_WALLET_BALANCE:
        "Insufficient wallet balance. Please add money to your wallet.",
    };

    if (errorMessages[error.message]) {

      const statusCode =
        error.message === "USER_NOT_FOUND" ||
        error.message === "WALLET_NOT_FOUND" ||
        error.message === "ROSE_PACK_NOT_FOUND"
          ? 404
          : error.message === "ACCOUNT_NOT_ACTIVE"
          ? 403
          : error.message ===
            "INSUFFICIENT_WALLET_BALANCE"
          ? 400
          : 400;

      return res.status(statusCode).json({
        success: false,
        message: errorMessages[error.message],
      });
    }

    next(error);
  }
};