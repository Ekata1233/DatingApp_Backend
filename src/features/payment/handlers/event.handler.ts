import {
  EventBookingStatus,
  EventTicketStatus,
} from "@prisma/client";

import QRCode from "qrcode";

export async function confirmEventBooking(
  tx: any,
  payment: any,
) {
  console.log(
    "========== CONFIRM EVENT BOOKING DEBUG ==========",
  );

  console.log(
    "Payment ID:",
    payment.id,
  );

  console.log(
    "Payment User ID:",
    payment.userId,
  );

  console.log(
    "Payment Amount:",
    payment.amount,
  );

  // ==========================================
  // 1. FIND PENDING BOOKING
  // ==========================================

  const booking =
    await tx.eventBooking.findFirst({
      where: {
        userId: payment.userId,

        status: {
          in: [
            EventBookingStatus.PENDING,
            EventBookingStatus.PAYMENT_PENDING,
          ],
        },
      },

      orderBy: {
        createdAt: "desc",
      },

      include: {
        tickets: true,
      },
    });

  if (!booking) {
    throw new Error(
      "Event booking not found",
    );
  }

  console.log(
    "Booking ID:",
    booking.id,
  );

  console.log(
    "Booking Number:",
    booking.bookingNumber,
  );

  console.log(
    "Ticket Count:",
    booking.ticketCount,
  );

  // ==========================================
  // 2. CALCULATE PAYMENT
  // ==========================================

  const newPaidAmount =
    Number(booking.paidAmount) +
    Number(payment.amount);

  const totalAmount =
    Number(booking.totalAmount);

  const isFullyPaid =
    newPaidAmount >= totalAmount;

  // ==========================================
  // 3. UPDATE BOOKING
  // ==========================================

  const updatedBooking =
    await tx.eventBooking.update({
      where: {
        id: booking.id,
      },

      data: {
        paidAmount: newPaidAmount,

        paymentId: payment.id,

        status: isFullyPaid
          ? EventBookingStatus.CONFIRMED
          : EventBookingStatus.PAYMENT_PENDING,
      },

      include: {
        tickets: true,
      },
    });

  // ==========================================
  // 4. GENERATE QR FOR EACH TICKET
  // ==========================================

  if (isFullyPaid) {
    for (
      const ticket of updatedBooking.tickets
    ) {
      if (
        ticket.status ===
        EventTicketStatus.CONFIRMED
      ) {
        continue;
      }

      const qrData = JSON.stringify({
        type: "EVENT_TICKET",

        bookingId:
          updatedBooking.id,

        bookingNumber:
          updatedBooking.bookingNumber,

        ticketId:
          ticket.ticketId,

        ticketType:
          ticket.ticketType,

        eventId:
          updatedBooking.eventId,
      });

      const qrCodeUrl =
        await QRCode.toDataURL(
          qrData,
          {
            errorCorrectionLevel: "H",
            margin: 2,
            width: 400,
          },
        );

      await tx.eventBookingTicket.update({
        where: {
          id: ticket.id,
        },

        data: {
          qrCodeUrl,

          status:
            EventTicketStatus.CONFIRMED,
        },
      });

      console.log(
        "QR GENERATED:",
        ticket.ticketId,
        ticket.ticketType,
      );
    }
  }

  console.log(
    "========== EVENT BOOKING UPDATED ==========",
  );

  console.log(
    "Booking ID:",
    updatedBooking.id,
  );

  console.log(
    "Payment ID:",
    updatedBooking.paymentId,
  );

  console.log(
    "Total Tickets:",
    updatedBooking.ticketCount,
  );

  console.log(
    "Paid Amount:",
    updatedBooking.paidAmount,
  );

  console.log(
    "Booking Status:",
    updatedBooking.status,
  );

  return updatedBooking;
}