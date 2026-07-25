import { PaymentStatus, WaitlistPlan } from "@prisma/client";
import { processPackageActivation } from "../package/package.service";

//PIAD WAITLIST JOINING
export async function createWaitlist(tx: any, payment: any) {
  const exists = await tx.waitlist.findUnique({
    where: {
      userId: payment.userId,
    },
  });

  if (exists) return;

  const result = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('waitlist_number_seq')
  `;

  await tx.waitlist.create({
    data: {
      userId: payment.userId,
      waitlistNumber: Number(result[0].nextval),
      plan: WaitlistPlan.PAID,
      amountPaid: payment.amount,
      paymentStatus: PaymentStatus.COMPLETED,
      paymentId: payment.id,
    },
  });
}


export async function activatePackage(tx: any, payment: any) {
   return await processPackageActivation(tx, payment);
}

export async function creditBoost(tx: any, payment: any) {
  // Credit boost package
}

export async function creditWallet(tx: any, payment: any) {
  // Add wallet balance
}