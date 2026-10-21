import {
  Prisma,
  Payment,
} from "@prisma/client";

export const fulfillDatePlanPayment = async (
  tx: Prisma.TransactionClient,
  payment: Payment,
) => {
  if (!payment.referenceId) {
    throw new Error("Date Plan package reference missing");
  }

  const plan = await tx.datePlanPackage.findUnique({
    where: {
      id: payment.referenceId,
    },
  });

  if (!plan) {
    throw new Error("Date Plan package not found");
  }

  if (!payment.amount.equals(plan.price)) {
    throw new Error("Date Plan payment amount mismatch");
  }

  // Connect your existing DatePlanPackage purchase/credit
  // service here, using tx and payment.id.
  //
  // Do not mark the payment COMPLETED until credits
  // have been granted successfully.

  throw new Error(
    "Date Plan credit service is not yet connected",
  );
};