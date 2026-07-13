import { Request, Response } from "express";
import { createOrder, verifyPayment } from "./payment.service";

export const createPaymentOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id; // From Auth Middleware

    const order = await createOrder(userId, req.body);

    return res.status(200).json({
      success: true,
      message: "Order created successfully.",
      data: order,
    });
  } catch (error: any) {
    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyPaymentController = async (
    req: Request,
  res: Response
) => {

    try {

        const payment =
            await verifyPayment(
                (req as any).user.id,
                req.body
            );

        return res.json({
            success: true,
            message: "Payment verified successfully.",
            data: payment
        });

    } catch (err: any) {

        return res.status(400).json({
            success: false,
            message: err.message
        });

    }

};