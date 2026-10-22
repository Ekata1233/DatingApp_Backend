
import {
  Prisma,
  Payment,
  PaymentPurpose,
  PaymentStatus,
  PurchasePaymentMethod,
  DatePlanTransactionType,
} from "@prisma/client";

export const fulfillDatePlanPayment = async (
  tx: Prisma.TransactionClient,
  payment: Payment
) => {
  console.log("DATE PLAN FULFILLMENT START:", {
    paymentId: payment.id,
    gatewayPaymentId: payment.payment_id,
    userId: payment.userId,
    referenceId: payment.referenceId,
    amount: payment.amount.toString(),
  });

  // ==========================================
  // 1. VALIDATE PAYMENT
  // ==========================================

  if (payment.purpose !== PaymentPurpose.OTHER) {
    throw new Error("Invalid Date Plan payment purpose");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("Date Plan payment is not completed");
  }

  if (
    !payment.payment_id ||
    !payment.payment_id.startsWith("pay_")
  ) {
    throw new Error("Valid Razorpay payment ID is required");
  }

  if (!payment.referenceId) {
    throw new Error("Date Plan package reference missing");
  }

  // ==========================================
  // 2. FIND DATE PLAN PACKAGE
  // ==========================================

  const plan = await tx.datePlanPackage.findUnique({
    where: {
      id: payment.referenceId,
    },
  });

  if (!plan) {
    throw new Error("Date Plan package not found");
  }

  if (!payment.amount.equals(plan.price)) {
    throw new Error("Date Plan payment amount mismatch");
  }

  if (plan.planCount <= 0) {
    throw new Error("Invalid Date Plan package quantity");
  }

  // ==========================================
  // 3. CHECK DUPLICATE PURCHASE
  // ==========================================

  const existingPurchase =
    await tx.datePlanPurchase.findFirst({
      where: {
        paymentId: payment.payment_id,
      },
    });

  if (existingPurchase) {
    if (existingPurchase.userId !== payment.userId) {
      throw new Error(
        "Date Plan payment belongs to another user"
      );
    }

    console.log("DATE PLAN ALREADY CREDITED:", {
      purchaseId: existingPurchase.id,
      paymentId: payment.payment_id,
    });

    return {
      alreadyCredited: true,
      purchaseId: existingPurchase.id,
      quantity: existingPurchase.quantity,
    };
  }

  // ==========================================
  // 4. CREATE DATE PLAN PURCHASE
  // ==========================================

  const purchase = await tx.datePlanPurchase.create({
    data: {
      userId: payment.userId,
      quantity: plan.planCount,
      amount: payment.amount.toNumber(),

      paymentMethod:
        PurchasePaymentMethod.PAYMENT_GATEWAY,

      // References Payment.payment_id,
      // not Payment.id
      paymentId: payment.payment_id,
    },
  });

  // ==========================================
  // 5. CREDIT USER DATE PLAN BALANCE
  // ==========================================

  const stats = await tx.datePlanUserStats.upsert({
    where: {
      userId: payment.userId,
    },

    create: {
      userId: payment.userId,

      totalDatePlan: plan.planCount,
      balance: plan.planCount,
      purchasedDataPlan: plan.planCount,
    },

    update: {
      totalDatePlan: {
        increment: plan.planCount,
      },

      balance: {
        increment: plan.planCount,
      },

      purchasedDataPlan: {
        increment: plan.planCount,
      },
    },
  });

  // ==========================================
  // 6. CREATE DATE PLAN TRANSACTION
  // ==========================================

  const transaction =
    await tx.datePlanTransaction.create({
      data: {
        userId: payment.userId,

        purchaseId: purchase.id,

        type:
          DatePlanTransactionType.PACKAGE_CREDIT,

        quantity: plan.planCount,

        balanceAfter: stats.balance,

        referenceId: payment.referenceId,

        description:
          `Purchased ${plan.planCount} Date Plans via Razorpay`,
      },
    });

  // ==========================================
  // 7. SUCCESS
  // ==========================================

  console.log("DATE PLAN CREDIT SUCCESS:", {
    userId: payment.userId,
    purchaseId: purchase.id,
    transactionId: transaction.id,
    quantity: plan.planCount,
    balanceAfter: stats.balance,
    paymentId: payment.payment_id,
  });

  return {
    alreadyCredited: false,
    purchaseId: purchase.id,
    transactionId: transaction.id,
    quantity: plan.planCount,
    balanceAfter: stats.balance,
  };
};
