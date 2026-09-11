


import * as paymentService from "./payment.service";

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




//razorpay



import { Request, Response } from "express";

import {
  createPaymentOrderService,
  verifyPaymentService,
  handleRazorpayWebhookService,
} from "./payment.service";

import {
  createPaymentsOrderSchema,
  verifyPaymentsSchema,
} from "./payment.validation";

// ============================================
// CREATE ORDER
// ============================================

export const createPaymentOrderController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(
          401,
        ).json({
          success: false,
          message:
            "Unauthorized",
        });
      }

      const validation =
        createPaymentsOrderSchema.safeParse(
          req.body,
        );

      if (
        !validation.success
      ) {
        return res.status(
          400,
        ).json({
          success: false,

          message:
            "Invalid payment data",

          errors:
            validation.error.flatten(),
        });
      }

      const result =
        await createPaymentOrderService(
          userId,
          validation.data,
        );

      return res.status(
        201,
      ).json({
        success: true,

        message:
          "Payment order created successfully",

        data: result,
      });
    } catch (error: any) {
      console.error(
        "CREATE PAYMENT ERROR:",
        error,
      );

      return res.status(
        400,
      ).json({
        success: false,

        message:
          error.message ||
          "Failed to create payment order",
      });
    }
  };

// ============================================
// VERIFY PAYMENT
// ============================================

export const verifyPaymentController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const userId =
        (req as any).user?.id;

      if (!userId) {
        return res.status(
          401,
        ).json({
          success: false,
          message:
            "Unauthorized",
        });
      }

      const validation =
        verifyPaymentsSchema.safeParse(
          req.body,
        );

      if (
        !validation.success
      ) {
        return res.status(
          400,
        ).json({
          success: false,

          message:
            "Invalid verification data",

          errors:
            validation.error.flatten(),
        });
      }

      const result =
        await verifyPaymentService(
          userId,
          validation.data,
        );

      return res.status(
        200,
      ).json(result);
    } catch (error: any) {
      console.error(
        "VERIFY PAYMENT ERROR:",
        error,
      );

      return res.status(
        400,
      ).json({
        success: false,

        message:
          error.message ||
          "Payment verification failed",
      });
    }
  };

// ============================================
// RAZORPAY WEBHOOK
// ============================================

export const razorpayWebhookController =
  async (
    req: Request,
    res: Response,
  ) => {
    try {
      const signature =
        req.headers[
          "x-razorpay-signature"
        ];

      if (
        !signature ||
        typeof signature !==
          "string"
      ) {
        return res.status(
          400,
        ).json({
          success: false,
          message:
            "Razorpay signature missing",
        });
      }

      const rawBody =
        (req as any).rawBody;

      if (!rawBody) {
        return res.status(
          400,
        ).json({
          success: false,

          message:
            "Webhook raw body missing",
        });
      }

      await handleRazorpayWebhookService(
        rawBody,
        signature,
      );

      return res.status(
        200,
      ).json({
        success: true,
      });
    } catch (error: any) {
      console.error(
        "RAZORPAY WEBHOOK ERROR:",
        error,
      );

      return res.status(
        400,
      ).json({
        success: false,

        message:
          error.message,
      });
    }
  };