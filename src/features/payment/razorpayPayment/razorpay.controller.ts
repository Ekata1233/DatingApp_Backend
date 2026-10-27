import { Request, Response } from "express";

import {
  createRazorpayOrderSchema,
  verifyRazorpaySchema,
} from "./razorpay.validation";

import {
  createRazorpayOrderService,
  verifyRazorpayPaymentService,
  getRazorpayPaymentStatusService,
} from "./razorpay.service";

export const createRazorpayOrderController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = createRazorpayOrderSchema.parse(req.body);
    const result = await createRazorpayOrderService(userId, data);

    return res.status(201).json({
      success: true,
      message: "Razorpay order created",
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyRazorpayController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = verifyRazorpaySchema.parse(req.body);

    const result = await verifyRazorpayPaymentService(
      userId,
      data,
    );

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getRazorpayStatusController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await getRazorpayPaymentStatusService(
      userId,
      req.params.paymentId as string,
    );

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};