import { Payment, Prisma } from "@prisma/client";

import { confirmsEventBooking } from "../../handlers/event.handler";

export async function fulfillEventBooking(
  tx: Prisma.TransactionClient,
  payment: Payment,
) {
  if (!payment.referenceId) {
    throw new Error("Event booking ID missing");
  }

  return confirmsEventBooking(tx, payment);
}