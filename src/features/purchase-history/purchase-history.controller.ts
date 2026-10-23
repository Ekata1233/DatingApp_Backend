
import {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  getPurchaseHistoryService,
  PurchaseHistoryType,
  PaymentMethodFilter,
} from "./purchase-history.service";

const validTypes = [
  "ALL",
  "ROSE",
  "COMPLIMENT",
  "BOOST",
  "PACKAGE",
  "DATE_PLAN",
];

const validMethods = [
  "ALL",
  "WALLET",
  "PAYMENT_GATEWAY",
];

export const getPurchaseHistoryController = async (
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

    const type = String(req.query.type ?? "ALL").toUpperCase();

    const paymentMethod = String(
      req.query.paymentMethod ?? "ALL",
    ).toUpperCase();

    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 10);

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid purchase history type",
      });
    }

    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const result = await getPurchaseHistoryService({
      userId,
      type: type as PurchaseHistoryType,
      paymentMethod: paymentMethod as PaymentMethodFilter,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Purchase history fetched successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
