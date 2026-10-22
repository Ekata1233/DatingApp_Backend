
import {
  Prisma,
  Payment,
  PaymentPurpose,
  PaymentStatus,
  BoostTransactionType,
  PurchasePaymentMethod,
} from "@prisma/client";

export const fulfillBoostPayment = async (
  tx: Prisma.TransactionClient,
  payment: Payment,
) => {
  console.log("BOOST FULFILLMENT START:", {
    paymentId: payment.id,
    gatewayPaymentId: payment.payment_id,
    userId: payment.userId,
    referenceId: payment.referenceId,
  });

  // ==========================================
  // 1. VALIDATE PAYMENT
  // ==========================================

  if (payment.purpose !== PaymentPurpose.BOOST) {
    throw new Error("Invalid Boost payment purpose");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("Boost payment is not completed");
  }

  if (!payment.payment_id?.startsWith("pay_")) {
    throw new Error("Valid Razorpay payment ID is required");
  }

  if (!payment.referenceId) {
    throw new Error("Boost option reference missing");
  }

  // ==========================================
  // 2. FIND BOOST OPTION
  // ==========================================

  const option = await tx.boostOption.findUnique({
    where: {
      id: payment.referenceId,
    },
    include: {
      boost: true,
    },
  });

  if (!option) {
    throw new Error("Boost option not found");
  }

  if (!payment.amount.equals(option.totalPrice)) {
    throw new Error("Boost payment amount mismatch");
  }

  if (option.boostCount <= 0) {
    throw new Error("Invalid Boost quantity");
  }

  // ==========================================
  // 3. PREVENT DUPLICATE CREDIT
  // ==========================================

  const existingPurchase = await tx.boostPurchase.findFirst({
    where: {
      paymentId: payment.payment_id,
    },
  });

  if (existingPurchase) {
    if (
      existingPurchase.userId !== payment.userId ||
      existingPurchase.boostOptionId !== option.id
    ) {
      throw new Error("Boost payment purchase mismatch");
    }

    return {
      alreadyCredited: true,
      purchaseId: existingPurchase.id,
      boostOptionId: option.id,
      boostType: option.boost.name,
      boostCount: existingPurchase.quantity,
    };
  }

  // ==========================================
  // 4. CREATE BOOST PURCHASE
  // ==========================================

  const purchase = await tx.boostPurchase.create({
    data: {
      userId: payment.userId,
      boostOptionId: option.id,
      quantity: option.boostCount,
      amount: payment.amount,

      // Change RAZORPAY if your enum uses
      // another name for gateway payments.
      paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,

      // References Payment.payment_id
      paymentId: payment.payment_id,
    },
  });

  // ==========================================
  // 5. FIND USER BOOST BALANCE
  // ==========================================

  const existingUserBoost = await tx.userBoost.findFirst({
    where: {
      user_id: payment.userId,
      boostId: option.boost_id,
      boost_option_id: option.id,
      is_active: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  let userBoost;

  if (existingUserBoost) {
    // ========================================
    // 6A. UPDATE EXISTING BOOST BALANCE
    // ========================================

    userBoost = await tx.userBoost.update({
      where: {
        id: existingUserBoost.id,
      },
      data: {
        total_boosts: {
          increment: option.boostCount,
        },
        remaining_boosts: {
          increment: option.boostCount,
        },
      },
    });
  } else {
    // ========================================
    // 6B. CREATE NEW BOOST BALANCE
    // ========================================

    const now = new Date();

    userBoost = await tx.userBoost.create({
      data: {
        user_id: payment.userId,
        boostId: option.boost_id,
        boost_option_id: option.id,

        total_boosts: option.boostCount,
        remaining_boosts: option.boostCount,

        weeklyLimit: 0,
        last_reset_at: now,
        next_reset_at: now,

        is_active: true,
      },
    });
  }

  // ==========================================
  // 7. CREATE BOOST TRANSACTION
  // ==========================================

  const transaction = await tx.boostTransaction.create({
    data: {
      userId: payment.userId,
      purchaseId: purchase.id,

      type: BoostTransactionType.PACKAGE_CREDIT,

      quantity: option.boostCount,
      boostBalanceAfter: userBoost.remaining_boosts,
    },
  });

  // ==========================================
  // 8. SUCCESS
  // ==========================================

  console.log("BOOST CREDIT SUCCESS:", {
    userId: payment.userId,
    purchaseId: purchase.id,
    transactionId: transaction.id,
    boostOptionId: option.id,
    boostType: option.boost.name,
    quantity: option.boostCount,
    remainingBoosts: userBoost.remaining_boosts,
    gatewayPaymentId: payment.payment_id,
  });

  return {
    alreadyCredited: false,
    purchaseId: purchase.id,
    transactionId: transaction.id,
    boostOptionId: option.id,
    boostType: option.boost.name,
    boostCount: option.boostCount,
    remainingBoosts: userBoost.remaining_boosts,
  };
};
