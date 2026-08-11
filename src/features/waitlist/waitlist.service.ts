import { prisma } from "../../prisma/prismaClient";
import { JoinWaitlistDto } from "./waitlist.validation";
import { PaymentStatus, WaitlistPlan } from "@prisma/client";

export const joinFreeWaitlistService = async (
  userId: string,
  payload?: JoinWaitlistDto
) => {
  return prisma.$transaction(async (tx) => {
    // Already joined?
    const existing = await tx.waitlist.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new Error("User already joined the waitlist");
    }

    // Generate next waitlist number
    const result = await tx.$queryRaw<{ nextval: bigint }[]>`
      SELECT nextval('waitlist_number_seq')
    `;

    const waitlistNumber = Number(result[0].nextval);

    // Create waitlist
    const waitlist = await tx.waitlist.create({
      data: {
        userId,
        waitlistNumber,
        plan: WaitlistPlan.FREE,
        amountPaid: 0,
        paymentStatus: PaymentStatus.COMPLETED,
        source: payload?.source,
        notes: payload?.notes,
      },
    });

    return waitlist;
  });
};

export const getWaitlistService = async (userId: string) => {
  const waitlist = await prisma.waitlist.findUnique({
    where: {
      userId,
    },
  });

  if (!waitlist) {
    throw new Error("User has not joined the waitlist");
  }

  return waitlist;
};