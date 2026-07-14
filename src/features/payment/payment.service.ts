import { PaymentStatus, Prisma } from "@prisma/client";
import { CreateOrderDto, VerifyPaymentDto } from "./payment.dto";
import razorpay from "../../config/razorpay";
import { prisma } from "../../prisma/prismaClient";
import crypto from "crypto";

export const createOrder = async (
  userId: string,
  payload: CreateOrderDto
) => {
  const { amount, purpose } = payload;

  // Bare-minimum guard now that there's no package to derive price from.
  if (!amount || amount <= 0) {
    throw new Error("Invalid amount.");
  }

  const amountInPaise = Math.round(amount * 100);

  const order = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: `USR_${userId}_${Date.now()}`,
    payment_capture: true,
  });

  const payment = await prisma.payment.create({
    data: {
      userId,
      amount, // rupees. See note at bottom re: storing paise instead.
      currency: "INR",
      payment_id: order.id,
      transactionId: order.receipt,
      status: PaymentStatus.PENDING,
      purpose,
      gatewayResponse: {
        id: order.id,
        entity: order.entity,
        amount: order.amount,
        amount_paid: order.amount_paid,
        amount_due: order.amount_due,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        attempts: order.attempts,
        created_at: order.created_at,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    paymentId: payment.id,
    razorpayOrderId: order.id,
    amount: order.amount,
    currency: order.currency,
    key: process.env.RAZORPAY_KEY_ID,
  };
};

export const verifyPayment = async (
  userId: string,
  payload: VerifyPaymentDto
) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = payload;

  // 1. Signature check — constant-time compare
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const signatureValid =
    generatedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );

  if (!signatureValid) {
    throw new Error("Payment verification failed.");
  }

  // 2. Load our order + ownership check (fixes IDOR — userId was unused before)
  const existing = await prisma.payment.findUnique({
    where: { payment_id: razorpay_order_id },
  });

  if (!existing || existing.userId !== userId) {
    throw new Error("Payment not found or not authorized.");
  }

  // 3. Idempotency — don't re-process a completed payment
  if (existing.status === PaymentStatus.COMPLETED) {
    return existing;
  }

  // 4. Confirm money was actually captured for the right order + amount
  const paymentDetails = await razorpay.payments.fetch(razorpay_payment_id);
const expectedPaise = existing.amount.mul(100).toNumber();
  if (
    paymentDetails.status !== "captured" ||
    paymentDetails.order_id !== razorpay_order_id ||
    Number(paymentDetails.amount) !== expectedPaise
  ) {
    await prisma.payment.update({
      where: { payment_id: razorpay_order_id },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: paymentDetails as unknown as Prisma.InputJsonValue,
      },
    });
    throw new Error("Payment not captured or amount mismatch.");
  }

  // 5. Mark completed
  const payment = await prisma.payment.update({
    where: { payment_id: razorpay_order_id },
    data: {
      status: PaymentStatus.COMPLETED,
      transactionId: razorpay_payment_id,
      gatewayResponse: paymentDetails as unknown as Prisma.InputJsonValue,
      paidAt: new Date(),
    },
  });

  return payment;
};

export const handleWebhookEvent = async (
  rawBody: Buffer,
  signature: string
) => {
  // 1. Verify signature over the RAW body
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest("hex");

  const valid =
    expectedSignature.length === signature.length &&
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature)
    );

  if (!valid) {
    throw new Error("Invalid webhook signature.");
  }

  const event = JSON.parse(rawBody.toString());
  const type: string = event.event;

  // We only act on payment lifecycle events tied to an order
  const paymentEntity = event.payload?.payment?.entity;
  if (!paymentEntity?.order_id) {
    return; // nothing to reconcile
  }

  const orderId = paymentEntity.order_id;

  const existing = await prisma.payment.findUnique({
    where: { payment_id: orderId },
  });

  if (!existing) {
    // Order we never created / already deleted — ignore, don't error.
    return;
  }

  // 2. Idempotency: if already in a terminal state matching the event, skip.
  if (type === "payment.captured") {
    if (existing.status === PaymentStatus.COMPLETED) return;

    // Amount safety check — same guard as verifyPayment
 const expectedPaise = existing.amount.mul(100).toNumber();
    if (Number(paymentEntity.amount) !== expectedPaise) {
      await prisma.payment.update({
        where: { payment_id: orderId },
        data: {
          status: PaymentStatus.FAILED,
          gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
        },
      });
      return;
    }

    await prisma.payment.update({
      where: { payment_id: orderId },
      data: {
        status: PaymentStatus.COMPLETED,
        transactionId: paymentEntity.id,
        gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
        paidAt: new Date(),
      },
    });
    return;
  }

  if (type === "payment.failed") {
    if (existing.status === PaymentStatus.COMPLETED) return; // already paid, ignore
    await prisma.payment.update({
      where: { payment_id: orderId },
      data: {
        status: PaymentStatus.FAILED,
        gatewayResponse: paymentEntity as unknown as Prisma.InputJsonValue,
      },
    });
    return;
  }

  // Other events (order.paid, refund.*) — ignore for now.
};