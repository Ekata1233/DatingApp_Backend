import {
  Request,
  Response,
  NextFunction,
} from "express";

import { z } from "zod";

import {
  purchasePackageWithWalletService,
} from "./package-purchase.service";

const purchasePackageSchema = z.object({
  priceId: z
    .string()
    .uuid("Invalid package price ID"),
});

export const purchasePackageWithWalletController =
  async (
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

      const parsed =
        purchasePackageSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          success: false,
          message:
            parsed.error.issues[0]?.message ||
            "Invalid request",
        });
      }

      const result =
        await purchasePackageWithWalletService(
          userId,
          parsed.data.priceId
        );

      return res.status(200).json({
        success: true,
        message:
          `${result.package.name} package purchased successfully`,
        data: result,
      });
    } catch (error: any) {
      const errorMessages:
        Record<string, string> = {
        USER_NOT_FOUND:
          "User not found",

        ACCOUNT_NOT_ACTIVE:
          "Your account is not active",

        PACKAGE_PRICE_NOT_FOUND:
          "Package or selected billing plan is unavailable",

        INVALID_PACKAGE_PRICE:
          "Invalid package price",

        INVALID_BILLING_CYCLE:
          "Invalid billing cycle",

        WALLET_NOT_FOUND:
          "Wallet not found",

        INSUFFICIENT_WALLET_BALANCE:
          "Insufficient wallet balance. Please add money to your wallet.",
      };

      if (errorMessages[error.message]) {
        return res.status(400).json({
          success: false,
          message:
            errorMessages[error.message],
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