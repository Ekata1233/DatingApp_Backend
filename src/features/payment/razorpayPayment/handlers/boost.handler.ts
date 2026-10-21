import {
  Prisma,
  Payment,
} from "@prisma/client";

import { creditBoost } from
  "../../handlers/boost.handler";

export const fulfillBoostPayment = async (
  tx: Prisma.TransactionClient,
  payment: Payment,
) => {
  if (!payment.referenceId) {
    throw new Error("Boost option reference missing");
  }

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

  await creditBoost(tx, payment);

  return {
    boostOptionId: option.id,
    boostType: option.boost.name,
    boostCount: option.boostCount,
  };
};