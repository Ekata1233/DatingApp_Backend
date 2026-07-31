import {
  Prisma,
  PurchasePaymentMethod,
  ComplimentTransactionType,
} from "@prisma/client";

interface CreditComplimentHandlerParams {
  tx: Prisma.TransactionClient;
  userId: string;
  storePack: any;
  paymentMethod: PurchasePaymentMethod;
  walletTransactionId?: string;
  paymentId?: string;
}

export async function creditComplimentHandler({
  tx,
  userId,
  storePack,
  paymentMethod,
  walletTransactionId,
  paymentId,
}: CreditComplimentHandlerParams) {
  /**
   * STEP 1
   * Get User Compliment Balance
   */
  const complimentBalance = await tx.userComplimentBalance.findUnique({
    where: {
      userId,
    },
  });

  if (!complimentBalance) {
    throw new Error("User compliment balance not found");
  }

  /**
   * STEP 2
   * Create Compliment Purchase
   */
  const complimentPurchase = await tx.complimentPurchase.create({
    data: {
      userId,

      quantity: storePack.quantity,

      amount: storePack.totalPrice,

      paymentMethod,

      paymentId,

      walletTransactionId,
    },
  });

  /**
   * STEP 3
   * Update Compliment Balance
   */
  const updatedBalance = await tx.userComplimentBalance.update({
    where: {
      userId,
    },
    data: {
      totalCompliments: {
        increment: storePack.quantity,
      },

      purchasedCompliments: {
        increment: storePack.quantity,
      },
    },
  });

  /**
   * STEP 4
   * Create Compliment Transaction
   */
  await tx.complimentTransaction.create({
    data: {
      userId,

      type: ComplimentTransactionType.PURCHASE,

      quantity: storePack.quantity,

      complimentBalanceAfter: updatedBalance.totalCompliments,

      purchaseId: complimentPurchase.id,
    },
  });

  /**
   * STEP 5
   * Return
   */
  return {
    purchaseId: complimentPurchase.id,
    totalCompliments: updatedBalance.totalCompliments,
    purchasedCompliments: updatedBalance.purchasedCompliments,
  };
}