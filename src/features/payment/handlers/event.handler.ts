import { EventBookingStatus } from "@prisma/client";

export async function confirmEventBooking(
  tx: any,
  payment: any,
) {
  // Find the pending booking of this user
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

  // Security check
  if (booking.userId !== payment.userId) {
    throw new Error(
      "Event booking does not belong to this user",
    );
  }

  // Already confirmed
  if (booking.status === EventBookingStatus.CONFIRMED) {
    console.log(
      `Event booking ${booking.id} already confirmed`,
    );

    return;
  }

  // Don't confirm cancelled/expired/refunded booking
  if (
    booking.status === EventBookingStatus.CANCELLED ||
    booking.status === EventBookingStatus.EXPIRED ||
    booking.status === EventBookingStatus.REFUNDED
  ) {
    throw new Error(
      `Event booking cannot be confirmed because its status is ${booking.status}`,
    );
  }

  const newPaidAmount =
    Number(booking.paidAmount) +
    Number(payment.amount);

  const totalAmount = Number(booking.totalAmount);

  await tx.eventBooking.update({
    where: {
      id: booking.id,
    },
    data: {
      paidAmount: newPaidAmount,
  // IMPORTANT
      paymentId: payment.id,
      status:
        newPaidAmount >= totalAmount
          ? EventBookingStatus.CONFIRMED
          : EventBookingStatus.PAYMENT_PENDING,
    },
  });

  console.log(
    `Event booking ${booking.id} payment completed. Paid: ${newPaidAmount}/${totalAmount}`,
  );
}