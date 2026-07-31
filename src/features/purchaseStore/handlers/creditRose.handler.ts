import { Prisma, PurchasePaymentMethod, RoseTransactionType } from "@prisma/client";

interface CreditRoseHandlerParams {
  tx: Prisma.TransactionClient;
  userId: string;
  storePack: any;
  paymentMethod: PurchasePaymentMethod;
  walletTransactionId?: string;
  paymentId?: string;
}

export async function creditRoseHandler({
  tx,
  userId,
  storePack,
  paymentMethod,
  walletTransactionId,
  paymentId,
}: CreditRoseHandlerParams) {

  /**
   * STEP 1
   * Get User Rose Balance
   */
  const roseBalance = await tx.userRoseBalance.findUnique({
    where: {
      userId,
    },
  });

  if (!roseBalance) {
    throw new Error("Rose balance not found");
  }

  /**
   * STEP 2
   * Create Rose Purchase
   */
  const rosePurchase = await tx.rosePurchase.create({
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
   * Update Rose Balance
   */
  const updatedBalance = await tx.userRoseBalance.update({
    where: {
      userId,
    },
    data: {
      totalRoses: {
        increment: storePack.quantity,
      },
      purchasedRoses: {
        increment: storePack.quantity,
      },
    },
  });

  /**
   * STEP 4
   * Create Rose Transaction
   */
  await tx.roseTransaction.create({
    data: {
      userId,
      type: RoseTransactionType.PURCHASE,
      quantity: storePack.quantity,
      roseBalanceAfter: updatedBalance.totalRoses,
      purchaseId: rosePurchase.id,
    },
  });

  /**
   * STEP 5
   * Return
   */
  return {
    purchaseId: rosePurchase.id,
    totalRoses: updatedBalance.totalRoses,
    purchasedRoses: updatedBalance.purchasedRoses,
  };
}