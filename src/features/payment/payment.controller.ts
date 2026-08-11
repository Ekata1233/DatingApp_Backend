

import { Request, Response } from "express";
import * as paymentService from "./payment.service";

//CREATE PAYMENT LINK
export async function createPayment(req: Request, res: Response) {
  try {
    const result = await paymentService.createPaymentLink((req as any).user.id, req.body);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
}

//WEBHOOK
export const payuWebhookController = async (
  req: Request,
  res: Response
) => {
  try {
    await paymentService.paymentWebhookService(req.body);

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//RETURN URL 
export const paymentReturnController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("Query:", req.query);

    return res.redirect(
      302,
      "https://www.welvors.com/stepdone/"
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error,
    });
  }
};