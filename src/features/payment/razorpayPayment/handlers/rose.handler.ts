import {
  Prisma,
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

  await creditRoseHandler({
    tx,
    userId,
    storePack,
    paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
    walletTransactionId: undefined,
    paymentId,
  });

  return {
    storePackId,
    itemType: "ROSE",
    quantity: storePack.quantity,
  };
};