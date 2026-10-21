import {
  Prisma,
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

  await creditComplimentHandler({
    tx,
    userId,
    storePack,
    paymentMethod: PurchasePaymentMethod.PAYMENT_GATEWAY,
    walletTransactionId: undefined,
    paymentId,
  });

  return {
    storePackId,
    itemType: "COMPLIMENT",
    quantity: storePack.quantity,
  };
};