// import { Request, Response } from "express";
// import { createOrder, handleWebhookEvent, verifyPayment } from "./payment.service";

// export const createPaymentOrder = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized." });
//     }

//     const order = await createOrder(userId, req.body);
//     return res.status(201).json({
//       success: true,
//       message: "Order created successfully.",
//       data: order,
//     });
//   } catch (error: any) {
//     console.error("createPaymentOrder error:", error);
//     return res.status(500).json({
//       success: false,
//       message: error?.message ?? "Failed to create order.",
//     });
//   }
// };

// export const verifyPaymentController = async (req: Request, res: Response) => {
//   try {
//     const userId = (req as any).user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized." });
//     }

//     const payment = await verifyPayment(userId, req.body);
//     return res.status(200).json({
//       success: true,
//       message: "Payment verified successfully.",
//       data: payment,
//     });
//   } catch (err: any) {
//     console.error("verifyPayment error:", err);
//     return res.status(400).json({
//       success: false,
//       message: err?.message ?? "Payment verification failed.",
//     });
//   }
// };


// export const razorpayWebhook = async (req: Request, res: Response) => {
//   try {
//     const signature = req.headers["x-razorpay-signature"] as string;
//     if (!signature) {
//       return res.status(400).json({ success: false, message: "Missing signature." });
//     }

//     // req.body is a Buffer here because of express.raw() on this route
//     await handleWebhookEvent(req.body as Buffer, signature);

//     // Always 200 fast so Razorpay doesn't retry-storm you.
//     return res.status(200).json({ success: true });
//   } catch (err: any) {
//     console.error("razorpayWebhook error:", err);
//     // Bad signature = 400 (Razorpay won't retry a 4xx as aggressively).
//     // Genuine processing errors: consider returning 500 so Razorpay retries.
//     return res.status(400).json({ success: false, message: err?.message });
//   }
// };

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
export const paymentReturnController = async (req: Request, res:Response) => {
  console.log(req.body);

  // Verify/update payment if needed

  return res.redirect(
    302,
    "https://www.fetchtrue.com/stepdone"
  );
};