
import {
  Prisma,
  PaymentPurpose,
  PaymentStatus,
  PurchasePaymentMethod,
  StoreItemType,
} from "@prisma/client";

import { creditComplimentHandler } from
  "../../../purchaseStore/handlers/creditCompliment.handler";

export const fulfillComplimentPayment = async (
  tx: Prisma.TransactionClient,
  userId: string,
  storePackId: string,
  paymentId: string,
) => {
  const payment = await tx.payment.findUnique({
    where: {
      payment_id: paymentId,
    },
  });

  if (!payment) {
    throw new Error("Compliment payment not found");
  }

  if (payment.userId !== userId) {
    throw new Error("Compliment payment user mismatch");
  }

  if (payment.purpose !== PaymentPurpose.PURCHASE_STORE) {
    throw new Error("Invalid payment purpose");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("Payment is not completed");
  }

  if (payment.referenceId !== storePackId) {
    throw new Error("Compliment pack reference mismatch");
  }

  const storePack = await tx.storePack.findUnique({
    where: {
      id: storePackId,
    },
  });

  if (!storePack) {
    throw new Error("Compliment pack not found");
  }

  if (storePack.itemType !== StoreItemType.COMPLIMENT) {
    throw new Error("Invalid Compliment pack");
  }

  if (!payment.amount.equals(storePack.totalPrice)) {
    throw new Error("Compliment payment amount mismatch");
  }

  await creditComplimentHandler({
    tx,
    userId,
    storePack,
    paymentMethod:
      PurchasePaymentMethod.PAYMENT_GATEWAY,
    walletTransactionId: undefined,
    paymentId: payment.payment_id!,
  });

  console.log("COMPLIMENT CREDIT SUCCESS:", {
    userId,
    storePackId,
    paymentId: payment.payment_id,
    quantity: storePack.quantity,
  });

  return {
    storePackId,
    itemType: "COMPLIMENT",
    quantity: storePack.quantity,
  };
};
