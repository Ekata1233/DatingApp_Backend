import crypto from "node:crypto";
import { Request, Response } from "express";

import {
  finalizeRazorpayPayment,
} from "./razorpay.service";

const verifyWebhookSignature = (
  rawBody: Buffer,
  signature: string,
): boolean => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET is missing",
    );
  }

  if (!/^[a-fA-F0-9]{64}$/.test(signature)) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex"),
  );
};

export const razorpayWebhookController = async (
  req: Request,
  res: Response,
) => {
  try {
    // =====================================
    // 1. GET RAW BODY
    // =====================================

    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      return res.status(400).json({
        success: false,
        message: "Webhook raw body required",
      });
    }

    // =====================================
    // 2. GET SIGNATURE
    // =====================================

    const signature =
      req.header("x-razorpay-signature") ?? "";

    // =====================================
    // 3. VERIFY WEBHOOK SIGNATURE
    // =====================================

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // =====================================
    // 4. PARSE WEBHOOK
    // =====================================

    const event = JSON.parse(
      rawBody.toString("utf8"),
    );

    if (
      !event ||
      typeof event.event !== "string" ||
      !event.payload
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook payload",
      });
    }

    console.log(
      "RAZORPAY WEBHOOK EVENT:",
      event.event,
    );

    // =====================================
    // 5. PAYMENT CAPTURED
    // =====================================

    if (event.event === "payment.captured") {
      const paymentEntity =
        event.payload?.payment?.entity;

      if (
        !paymentEntity?.id ||
        !paymentEntity?.order_id
      ) {
        throw new Error(
          "Invalid captured payment payload",
        );
      }

      const result = await finalizeRazorpayPayment(
        paymentEntity.order_id,
        paymentEntity.id,
      );

      console.log(
        "RAZORPAY PAYMENT PROCESSED:",
        result.payment.id,
      );

      return res.status(200).json({
        success: true,
        message: result.alreadyProcessed
          ? "Payment already processed"
          : "Payment processed successfully",
      });
    }

    // =====================================
    // 6. ORDER PAID
    // =====================================

    if (event.event === "order.paid") {
      // payment.captured is the primary
      // fulfillment event in this implementation.
      //
      // Do not credit the wallet or activate
      // packages here again.

      console.log(
        "RAZORPAY ORDER PAID:",
        event.payload?.order?.entity?.id,
      );

      return res.status(200).json({
        success: true,
        message: "Order paid event received",
      });
    }

    // =====================================
    // 7. PAYMENT FAILED
    // =====================================

    if (event.event === "payment.failed") {
      const paymentEntity =
        event.payload?.payment?.entity;

      console.log(
        "RAZORPAY PAYMENT ATTEMPT FAILED:",
        paymentEntity?.id,
      );

      // Do not mark the entire Payment record
      // FAILED here. Another payment attempt
      // for the same order may still succeed.

      return res.status(200).json({
        success: true,
        message: "Failed attempt acknowledged",
      });
    }

    // =====================================
    // 8. OTHER EVENTS
    // =====================================

    return res.status(200).json({
      success: true,
      message: "Webhook event acknowledged",
    });
  } catch (error) {
    console.error(
      "RAZORPAY WEBHOOK ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};