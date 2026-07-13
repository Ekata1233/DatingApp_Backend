
import { PaymentStatus, Prisma } from "@prisma/client";
import { CreateOrderDto } from "./payment.dto";
import razorpay from "../../config/razorpay";
import { prisma } from "../../prisma/prismaClient";
import crypto from "crypto";
import { VerifyPaymentDto } from "./payment.dto";

export const createOrder = async (
  userId: string,
  payload: CreateOrderDto
) => {
  const { amount, purpose, packageId } = payload;

  // Create Razorpay Order
  const order = await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
    payment_capture: true,
  });

  // Save Payment
  const payment = await prisma.payment.create({
    data: {
      userId,
      packageId,
      amount,
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

    const {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
    } = payload;

    const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(
            razorpay_order_id + "|" + razorpay_payment_id
        )
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
        throw new Error("Payment verification failed.");
    }

    const paymentDetails =
        await razorpay.payments.fetch(
            razorpay_payment_id
        );

    const payment =
        await prisma.payment.update({
            where: {
                payment_id: razorpay_order_id
            },
            data: {
                status: PaymentStatus.COMPLETED,
                transactionId: razorpay_payment_id,
                gatewayResponse: paymentDetails,
                paidAt: new Date()
            }
        });

    return payment;
};