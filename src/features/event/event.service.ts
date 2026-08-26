import { prisma } from "../../prisma/prismaClient";

export async function getEventBookingPaymentSuccess(
  userId: string,
  bookingId: string,
) {
  const booking = await prisma.eventBooking.findFirst({
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
          endTime: true,
          venueName: true,
          fullAddress: true,
          city: true,
          heroImage: true,
        },
      },
      payment: {
        select: {
          id: true,
          payment_id: true,
          transactionId: true,
          amount: true,
          currency: true,
          status: true,
          paidAt: true,
          gatewayResponse: true,
        },
      },
    },
  });

  if (!booking) {
    throw new Error("Event booking not found");
  }

  if (booking.status !== "CONFIRMED") {
    throw new Error(
      `Event booking is not confirmed. Current status: ${booking.status}`,
    );
  }

  if (!booking.payment) {
    throw new Error("Payment details not found");
  }

  const gatewayResponse: any =
    booking.payment.gatewayResponse || {};

  const result = gatewayResponse?.result || {};

  return {
    booking: {
      id: booking.id,
      bookingNumber: booking.bookingNumber,
      ticketId: booking.ticketId,
      ticketCount: booking.ticketCount,
      ticketAmount: Number(booking.ticketAmount),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      status: booking.status,
      qrCodeUrl: booking.qrCodeUrl,
    },

    payment: {
      transactionId:
        booking.payment.payment_id ||
        result.transactionId ||
        null,

      orderId: booking.payment.transactionId,

      paidVia:
        result.paymentMode ||
        result.mode ||
        gatewayResponse?.mode ||
        null,

      paidAt: booking.payment.paidAt,

      amount: Number(booking.payment.amount),

      currency: booking.payment.currency || "INR",

      status: booking.payment.status,

      gatewayPaymentStatus:
        result.paymentStatus || null,
    },

    event: {
      id: booking.event.id,
      title: booking.event.title,
      eventDate: booking.event.eventDate,
      startTime: booking.event.startTime,
      endTime: booking.event.endTime,
      venueName: booking.event.venueName,
      fullAddress: booking.event.fullAddress,
      city: booking.event.city,
      heroImage: booking.event.heroImage,
    },
  };
}