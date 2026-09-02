

// import { Request, Response } from "express";
// import * as paymentService from "./payment.service";

// //CREATE PAYMENT LINK
// export async function createPayment(req: Request, res: Response) {
//   try {
//     const result = await paymentService.createPaymentLink((req as any).user.id, req.body);

//     return res.status(201).json({
//       success: true,
//       data: result,
//     });
//   } catch (error: any) {
//     return res.status(400).json({
//       success: false,
//       message: error.message,
//     });
//   }
// }

// //WEBHOOK
// export const payuWebhookController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     await paymentService.paymentWebhookService(req.body);

//     return res.status(200).json({
//       success: true,
//     });
//   } catch (error: any) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// //RETURN URL 
// export const paymentReturnController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     console.log("Headers:", req.headers);
//     console.log("Body:", req.body);
//     console.log("Query:", req.query);

//     return res.redirect(
//       302,
//       "https://www.welvors.com/stepdone/"
//     );
//   } catch (error) {
//     console.error(error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal Server Error",
//       error,
//     });
//   }
// };

import { Request, Response } from "express";

import {
  createPaymentOrderService,
  handleRazorpayWebhookService,
  verifyPaymentService,
} from "./payment.service";

import {
  createPaymentOrderSchema,
  verifyPaymentSchema,
} from "./payment.validation";

export const createPaymentOrderController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const data = createPaymentOrderSchema.parse(req.body);

    const result = await createPaymentOrderService(
      userId,
      data,
    );

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Create Payment Order Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to create payment order",
    });
  }
};

export const verifyPaymentController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;

    const data = verifyPaymentSchema.parse(req.body);

    const result = await verifyPaymentService(
      userId,
      data,
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Verify Payment Error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Payment verification failed",
    });
  }
};

export const razorpayWebhookController = async (
  req: Request,
  res: Response,
) => {
  try {
    const signature =
      req.headers["x-razorpay-signature"];

    if (!signature || typeof signature !== "string") {
      return res.status(400).json({
        success: false,
        message: "Razorpay signature missing",
      });
    }

    /**
     * req.body MUST be raw body.
     */
    const rawBody = req.body;

    await handleRazorpayWebhookService(
      rawBody,
      signature,
    );

    return res.status(200).json({
      success: true,
    });
  } catch (error: any) {
    console.error(
      "Razorpay Webhook Error:",
      error,
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};