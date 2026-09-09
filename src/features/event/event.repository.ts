import { prisma } from "../../prisma/prismaClient";


export const findEventBookingForCancellation = async (
  bookingId: string,
  userId: string,
) => {
  return prisma.eventBooking.findFirst({
    where: {
      id: bookingId,
      userId,
    },

    include: {
      event: {
        select: {
          id: true,
          title: true,
          eventDate: true,
          startTime: true,
          refundWindow: true,
        },
      },

      tickets: {
        select: {
          id: true,
          ticketId: true,
          status: true,
          ticketAmount: true,
        },
      },

      payment: {
        select: {
          id: true,
          payment_id: true,
          transactionId: true,
          status: true,
        },
      },
    },
  });
};

type CancelBookingData = {
  cancellationReason: string;
  cancellationComment?: string | null;
  cancelledAt: Date;

  refundEligible: boolean;
  refundAmount: number;
  refundReason?: string | null;
  refundRequestedAt?: Date | null;

  status: "CANCELLED" | "REFUND_PENDING";
};

export const cancelEventBookingRepository = async (
  bookingId: string,
  data: CancelBookingData,
) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.eventBooking.update({
      where: {
        id: bookingId,
      },

      data: {
        cancellationReason: data.cancellationReason,
        cancellationComment:
          data.cancellationComment ?? null,

        cancelledAt: data.cancelledAt,

        refundEligible: data.refundEligible,
        refundAmount: data.refundAmount,

        refundReason: data.refundReason ?? null,

        refundRequestedAt:
          data.refundRequestedAt ?? null,

        status: data.status,
      },

      include: {
        event: {
          select: {
            id: true,
            title: true,
            eventDate: true,
            startTime: true,
            refundWindow: true,
          },
        },

        tickets: true,
      },
    });

    await tx.eventBookingTicket.updateMany({
      where: {
        bookingId,
      },

      data: {
        status: "CANCELLED",
      },
    });

    return booking;
  });
};

export const markBookingRefundedRepository = async (
  bookingId: string,
  refundReferenceId: string,
) => {
  return prisma.eventBooking.update({
    where: {
      id: bookingId,
    },

    data: {
      status: "REFUNDED",
      refundedAt: new Date(),
      refundReferenceId,
    },
  });
};