import { prisma } from "../../prisma/prismaClient";
import { JoinWaitlistDto } from "./waitlist.validation";
import { PaymentStatus } from "@prisma/client";

export const joinWaitlistService = async (
    userId: string,
    payload: JoinWaitlistDto
) => {
    const { paymentId, source } = payload;
    
    return await prisma.$transaction(async (tx) => {
        // Verify payment belongs to user
        const payment = await tx.payment.findFirst({
            where: {
                id: paymentId,
                userId,
            },
        });

        if (!payment) {
            throw new Error("Payment not found");
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
            throw new Error("Payment is not completed");
        }

        // Already joined
        const existingUser = await tx.waitlist.findUnique({
            where: {
                userId,
            },
        });

        if (existingUser) {
            throw new Error("User already joined the waitlist");
        }

        // Payment already used
        const existingPayment = await tx.waitlist.findFirst({
            where: {
                paymentId,
            },
        });

        if (existingPayment) {
            throw new Error("Payment already used");
        }

        // Get next waitlist number from PostgreSQL sequence
        const result =
            await tx.$queryRaw<{ nextval: bigint }[]>`
        SELECT nextval('waitlist_number_seq')
      `;

        const waitlistNumber = Number(result[0].nextval);

        return await tx.waitlist.create({
            data: {
                userId,
                waitlistNumber,
                amountPaid: payment.amount,
                paymentStatus: payment.status,
                paymentId,
                source,
            },
            include: {
                payment: true,
            },
        });
    });
};