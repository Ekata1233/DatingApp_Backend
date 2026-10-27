
import { PaymentPurpose, PaymentStatus } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";

export const razorpayRepository = {
  // ==========================================
  // 1. FIND PAYMENT BY RAZORPAY ORDER ID
  // ==========================================
  // Works for all payment purposes.
  // Pending: payment_id = Razorpay order ID
  // Completed: transactionId = Razorpay order ID

  findByOrderId(orderId: string) {
    return prisma.payment.findFirst({
      where: {
        OR: [
          { payment_id: orderId },
          { transactionId: orderId },
        ],
      },
    });
  },

  // ==========================================
  // 2. FIND USER PAYMENT BY DATABASE PAYMENT ID
  // ==========================================

  findUserPayment(userId: string, paymentId: string) {
    return prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
    });
  },

  // ==========================================
  // 3. FIND PAYMENT BY RAZORPAY PAYMENT ID
  // ==========================================

  findByPaymentId(razorpayPaymentId: string) {
    return prisma.payment.findFirst({
      where: {
        payment_id: razorpayPaymentId,
      },
    });
  },

  // ==========================================
  // 4. FIND PAYMENT BY PURCHASE REFERENCE ID
  // ==========================================
  // For:
  // BOOST -> BoostOption ID
  // DATE_PLAN -> DatePlanPackage ID
  // ROSE / COMPLIMENT -> StorePack ID
  // EVENT_BOOKING -> EventBooking ID

  findByReferenceId(
    userId: string,
    referenceId: string,
    purpose: PaymentPurpose,
  ) {
    return prisma.payment.findMany({
      where: {
        userId,
        referenceId,
        purpose,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },

  // ==========================================
  // 5. FIND COMPLETED PAYMENTS BY USER
  // ==========================================

  findCompletedPayments(userId: string) {
    return prisma.payment.findMany({
      where: {
        userId,
        status: PaymentStatus.COMPLETED,
      },
      orderBy: {
        created_at: "desc",
      },
    });
  },
};
