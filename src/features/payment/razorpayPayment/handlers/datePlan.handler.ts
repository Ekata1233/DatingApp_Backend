
import {
  Prisma,
  Payment,
  PaymentPurpose,
  PaymentStatus,
} from "@prisma/client";

export const fulfillDatePlanPayment = async (
  tx: Prisma.TransactionClient,
  payment: Payment,
) => {
  // 1. Validate payment
  if (payment.purpose !== PaymentPurpose.OTHER) {
    throw new Error("Invalid Date Plan payment purpose");
  }

  if (payment.status !== PaymentStatus.COMPLETED) {
    throw new Error("Date Plan payment is not completed");
  }

  if (!payment.referenceId) {
    throw new Error("Date Plan package reference missing");
  }

  // 2. Find package
  const plan = await tx.datePlanPackage.findUnique({
    where: {
      id: payment.referenceId,
    },
  });

  if (!plan) {
    throw new Error("Date Plan package not found");
  }

  // 3. Validate amount
  if (!payment.amount.equals(plan.price)) {
    throw new Error("Date Plan payment amount mismatch");
  }

  // 4. CREDIT DATE PLANS HERE
  // Call your existing Date Plan purchase/credit logic
  // using this same transaction.
  //
  // The credit operation must update the user's
  // available Date Plan balance and prevent duplicate credits.

  // Do not return success until credits are granted.
  throw new Error("Date Plan credit implementation required");
};
