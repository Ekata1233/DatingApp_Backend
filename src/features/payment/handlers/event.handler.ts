import { EventBookingStatus } from "@prisma/client";
import QRCode from "qrcode";

export async function confirmEventBooking(
  tx: any,
  payment: any,
) {
  console.log(
    "========== CONFIRM EVENT BOOKING DEBUG ==========",
  );

  console.log("Payment ID:", payment.id);
  console.log("Payment User ID:", payment.userId);
  console.log("Payment Amount:", payment.amount);

  const booking = await tx.eventBooking.findFirst({
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
  });

  if (!booking) {
    throw new Error("Event booking not found");
  }

  console.log("Booking ID:", booking.id);
  console.log("Booking ticket ID:", booking.ticketId);

  const newPaidAmount =
    Number(booking.paidAmount) +
    Number(payment.amount);

  const totalAmount = Number(booking.totalAmount);

  // Generate QR only when booking becomes fully confirmed
  let qrCodeUrl = booking.qrCodeUrl;

  if (
    newPaidAmount >= totalAmount &&
    !qrCodeUrl
  ) {
    const qrData = JSON.stringify({
      type: "EVENT_TICKET",
      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,
      ticketId: booking.ticketId,
      eventId: booking.eventId,
    });

    qrCodeUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 400,
    });

    console.log(
      "QR CODE GENERATED FOR TICKET:",
      booking.ticketId,
    );
  }

  const updatedBooking =
    await tx.eventBooking.update({
      where: {
        id: booking.id,
      },
      data: {
        paidAmount: newPaidAmount,

        paymentId: payment.id,

        status:
          newPaidAmount >= totalAmount
            ? EventBookingStatus.CONFIRMED
            : EventBookingStatus.PAYMENT_PENDING,

        qrCodeUrl,
      },
    });

  console.log(
    "========== BOOKING UPDATED ==========",
  );

  console.log("Booking ID:", updatedBooking.id);
  console.log(
    "Payment ID:",
    updatedBooking.paymentId,
  );
  console.log(
    "Ticket ID:",
    updatedBooking.ticketId,
  );
  console.log(
    "QR generated:",
    !!updatedBooking.qrCodeUrl,
  );
}