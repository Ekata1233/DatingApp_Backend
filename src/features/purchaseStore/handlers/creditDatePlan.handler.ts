import {
  Prisma,
  PurchasePaymentMethod,
  DatePlanTransactionType,
} from "@prisma/client";

interface CreditDatePlanHandlerParams {
  tx: Prisma.TransactionClient;
  userId: string;
  storePack: any;
  paymentMethod: PurchasePaymentMethod;
  walletTransactionId?: string;
  paymentId?: string;
}

export async function creditDatePlanHandler({
  tx,
  userId,
  storePack,
  paymentMethod,
  walletTransactionId,
  paymentId,
}: CreditDatePlanHandlerParams) {

  /**
   * STEP 1
   * Get User Date Plan Stats
   */
  const stats = await tx.datePlanUserStats.findUnique({
    where: {
      userId,
    },
  });

  if (!stats) {
    throw new Error("Date plan balance not found");
  }

  /**
   * STEP 2
   * Create Purchase
   */
  const purchase = await tx.datePlanPurchase.create({
    data: {
      userId,

      quantity: storePack.quantity,

      amount: Number(storePack.totalPrice),

      paymentMethod,

      paymentId,

      walletTransactionId,
    },
  });

  /**
   * STEP 3
   * Update Balance
   */
  const updatedStats = await tx.datePlanUserStats.update({
    where: {
      userId,
    },
    data: {
      totalDatePlan: {
        increment: storePack.quantity,
      },

      purchasedDataPlan: {
        increment: storePack.quantity,
      },

      balance: {
        increment: storePack.quantity,
      },
    },
  });

  /**
   * STEP 4
   * Create Transaction
   */
  await tx.datePlanTransaction.create({
    data: {
      userId,

      type: DatePlanTransactionType.PACKAGE_CREDIT,

      quantity: storePack.quantity,

      balanceAfter: updatedStats.balance,

      purchaseId: purchase.id,

      description: `Purchased ${storePack.name}`,
    },
  });

  /**
   * STEP 5
   * Return
   */
  return {
    purchaseId: purchase.id,
    balance: updatedStats.balance,
    totalDatePlans: updatedStats.totalDatePlan,
  };
}