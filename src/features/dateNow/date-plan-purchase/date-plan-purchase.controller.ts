import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  purchaseDatePlanWithWalletSchema,
} from "./date-plan-purchase.validation";

import {
  purchaseDatePlanWithWalletService,
} from "./date-plan-purchase.service";

export const purchaseDatePlanWithWalletController =
  async (
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
        purchaseDatePlanWithWalletSchema.safeParse(
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

      // 3. Purchase Date Plans

      const result =
        await purchaseDatePlanWithWalletService(
          userId,
          parsed.data.packageId
        );

      // 4. Return success response

      return res.status(200).json({
        success: true,

        message:
          `${result.datePlans.purchased} Date Plans purchased successfully!`,

        data: result,
      });

    } catch (error: any) {

      // 5. Handle known errors

      const errorMessages: Record<string, string> = {
        USER_NOT_FOUND:
          "User not found",

        ACCOUNT_NOT_ACTIVE:
          "Your account is not active",

        DATE_PLAN_PACKAGE_NOT_FOUND:
          "Date Plan package not found or unavailable",

        INVALID_DATE_PLAN_PACKAGE:
          "Invalid Date Plan package configuration",

        WALLET_NOT_FOUND:
          "Wallet not found",

        INSUFFICIENT_WALLET_BALANCE:
          "Insufficient wallet balance. Please add money to your wallet.",
      };

      if (errorMessages[error.message]) {

        const statusCode =
          error.message === "USER_NOT_FOUND" ||
          error.message === "WALLET_NOT_FOUND" ||
          error.message ===
            "DATE_PLAN_PACKAGE_NOT_FOUND"
            ? 404
            : error.message ===
              "ACCOUNT_NOT_ACTIVE"
            ? 403
            : 400;

        return res.status(statusCode).json({
          success: false,
          message: errorMessages[error.message],
        });
      }

      // Handle concurrent transaction conflicts

      if (error.code === "P2034") {
        return res.status(409).json({
          success: false,

          message:
            "Purchase could not be completed due to a concurrent transaction. Please try again.",
        });
      }

      next(error);
    }
  };