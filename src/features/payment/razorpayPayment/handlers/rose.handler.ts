
import {
  Prisma,
  PaymentPurpose,
  PaymentStatus,
  PurchasePaymentMethod,
  StoreItemType,
} from "@prisma/client";

import { creditRoseHandler } from
  "../../../purchaseStore/handlers/creditRose.handler";

export const fulfillRosePayment = async (
  tx: Prisma.TransactionClient,
  userId: string,
  storePackId: string,
  paymentId: string,
) => {
  // 1. Verify payment using Razorpay payment ID
  const payment = await tx.payment.findUnique({
    where: {
      payment_id: paymentId,
    },
  });

  if (!payment) {
    throw new Error("Rose payment record not found");
  }

  if (payment.userId !== userId) {
    throw new Error("Rose payment user mismatch");
  }

  if (payment.purpose !== PaymentPurpose.PURCHASE_STORE) {
    throw new Error("Invalid Rose payment purpose");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("Rose payment is not completed");
  }

  if (payment.referenceId !== storePackId) {
    throw new Error("Rose pack reference mismatch");
  }

  // 2. Verify Rose pack
  const storePack = await tx.storePack.findUnique({
    where: {
      id: storePackId,
    },
  });

  if (!storePack) {
    throw new Error("Rose pack not found");
  }

  if (storePack.itemType !== StoreItemType.ROSE) {
    throw new Error("Invalid Rose pack");
  }

  if (!payment.amount.equals(storePack.totalPrice)) {
    throw new Error("Rose payment amount mismatch");
  }

  // 3. Credit Rose
  await creditRoseHandler({
    tx,
    userId,
    storePack,
    paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
    walletTransactionId: undefined,
    paymentId: payment.payment_id!,
  });

  return {
    storePackId: storePack.id,
    itemType: "ROSE",
    quantity: storePack.quantity,
  };
};
