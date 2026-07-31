import {
  Prisma,
  PurchasePaymentMethod,
  BoostTransactionType,
} from "@prisma/client";

interface CreditBoostHandlerParams {
  tx: Prisma.TransactionClient;
  userId: string;
  storePack: any;
  paymentMethod: PurchasePaymentMethod;
  walletTransactionId?: string;
  paymentId?: string;
}

export async function creditBoostHandler({
  tx,
  userId,
  storePack,
  paymentMethod,
  walletTransactionId,
  paymentId,
}: CreditBoostHandlerParams) {

  /**
   * STEP 1
   * Get User Boost Balance
   */
  const userBoost = await tx.userBoost.findFirst({
    where: {
      user_id: userId,
      is_active: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  if (!userBoost) {
    throw new Error("User boost balance not found");
  }

  /**
   * STEP 2
   * Create Boost Purchase
   */
  const boostPurchase = await tx.boostPurchase.create({
    data: {
      userId,

      boostOptionId: storePack.boostOptionId,

      quantity: storePack.quantity,

      amount: storePack.totalPrice,

      paymentMethod,

      paymentId,

      walletTransactionId,
    },
  });

  /**
   * STEP 3
   * Update User Boost Balance
   */
  const updatedBoost = await tx.userBoost.update({
    where: {
      id: userBoost.id,
    },
    data: {
      total_boosts: {
        increment: storePack.quantity,
      },

      remaining_boosts: {
        increment: storePack.quantity,
      },
    },
  });

  /**
   * STEP 4
   * Create Boost Transaction
   */
  await tx.boostTransaction.create({
    data: {
      userId,

      type: BoostTransactionType.PURCHASE,

      quantity: storePack.quantity,

      boostBalanceAfter: updatedBoost.remaining_boosts,

      purchaseId: boostPurchase.id,
    },
  });

  /**
   * STEP 5
   * Return
   */
  return {
    purchaseId: boostPurchase.id,
    totalBoosts: updatedBoost.total_boosts,
    remainingBoosts: updatedBoost.remaining_boosts,
  };
}