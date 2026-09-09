import { EventBookingStatus } from "@prisma/client";
import { prisma } from "../../prisma/prismaClient";
import { cancelEventBookingRepository, findEventBookingForCancellation } from "./event.repository";

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
     
      ticketCount: booking.ticketCount,
      ticketAmount: Number(booking.ticketAmount),
      totalAmount: Number(booking.totalAmount),
      paidAmount: Number(booking.paidAmount),
      status: booking.status,
      
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



interface GetUserEventBookingsParams {
  userId: string;
  status?: string;
  page: number;
  limit: number;
}

export const getUserEventBookingsService = async ({
  userId,
  status,
  page,
  limit,
}: GetUserEventBookingsParams) => {
  const skip = (page - 1) * limit;

  const where: any = {
    userId,
  };

  // Status filter
  if (status && status !== "ALL") {
    if (
      !Object.values(EventBookingStatus).includes(
        status as EventBookingStatus
      )
    ) {
      throw new Error(`Invalid booking status: ${status}`);
    }

    where.status = status as EventBookingStatus;
  }

  const [bookings, total] = await Promise.all([
    prisma.eventBooking.findMany({
      where,

      skip,
      take: limit,

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        
        paidAmount: true,

        status: true,

        

        event: {
          select: {
            id: true,
            title: true,
            eventType: true,
            eventDate: true,
            startTime: true,
            endTime: true,
            venueName: true,
            fullAddress: true,
            latitude: true,
            longitude: true,
            heroImage: true,
          },
        },
      },
    }),

    prisma.eventBooking.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};





/* =========================================================
   TYPES
========================================================= */

interface CancelEventBookingInput {
  reason: string;
  comment?: string;
}

/* =========================================================
   HELPER
   Combine eventDate + startTime
========================================================= */

const getEventStartDateTime = (
  eventDate: Date,
  startTime: string,
): Date => {
  const eventStart = new Date(eventDate);

  const [hours, minutes] = startTime
    .split(":")
    .map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    throw new Error(
      "Invalid event start time format",
    );
  }

  eventStart.setHours(
    hours,
    minutes,
    0,
    0,
  );

  return eventStart;
};

/* =========================================================
   CANCEL EVENT BOOKING SERVICE
========================================================= */

export const cancelEventBookingService = async (
  userId: string,
  bookingId: string,
  input: CancelEventBookingInput,
) => {
  /* -------------------------------------------------------
     1. Validate user
  ------------------------------------------------------- */

  if (!userId) {
    throw new Error("User ID is required");
  }

  /* -------------------------------------------------------
     2. Validate booking id
  ------------------------------------------------------- */

  if (!bookingId) {
    throw new Error("Booking ID is required");
  }

  /* -------------------------------------------------------
     3. Validate body
  ------------------------------------------------------- */

  const reason = input.reason?.trim();

  const comment =
    input.comment?.trim() || null;

  if (!reason) {
    throw new Error(
      "Cancellation reason is required",
    );
  }

  // Your DB:
  // cancellationReason String? @db.VarChar(100)
  if (reason.length > 100) {
    throw new Error(
      "Cancellation reason cannot exceed 100 characters",
    );
  }

  // Your DB:
  // cancellationComment String? @db.VarChar(500)
  if (
    comment &&
    comment.length > 500
  ) {
    throw new Error(
      "Cancellation comment cannot exceed 500 characters",
    );
  }

  /* -------------------------------------------------------
     4. Find user's booking
  ------------------------------------------------------- */

  const booking =
    await findEventBookingForCancellation(
      bookingId,
      userId,
    );

  if (!booking) {
    throw new Error(
      "Event booking not found",
    );
  }

  /* -------------------------------------------------------
     5. Check booking status
  ------------------------------------------------------- */

  if (booking.status === "CANCELLED") {
    throw new Error(
      "Booking is already cancelled",
    );
  }

  if (
    booking.status ===
    "REFUND_PENDING"
  ) {
    throw new Error(
      "Booking cancellation is already processed and refund is pending",
    );
  }

  if (booking.status === "REFUNDED") {
    throw new Error(
      "Booking has already been cancelled and refunded",
    );
  }

  if (booking.status === "ATTENDED") {
    throw new Error(
      "Attended booking cannot be cancelled",
    );
  }

  if (booking.status === "EXPIRED") {
    throw new Error(
      "Expired booking cannot be cancelled",
    );
  }

  if (booking.status === "PENDING") {
    throw new Error(
      "Pending booking cannot be cancelled",
    );
  }

  if (
    booking.status ===
    "PAYMENT_PENDING"
  ) {
    throw new Error(
      "Payment pending booking cannot be cancelled",
    );
  }

  // Only CONFIRMED bookings are allowed
  if (booking.status !== "CONFIRMED") {
    throw new Error(
      "This booking cannot be cancelled",
    );
  }

  /* -------------------------------------------------------
     6. Validate event
  ------------------------------------------------------- */

  if (!booking.event) {
    throw new Error(
      "Event information not found",
    );
  }

  if (!booking.event.eventDate) {
    throw new Error(
      "Event date is not configured",
    );
  }

  if (!booking.event.startTime) {
    throw new Error(
      "Event start time is not configured",
    );
  }

  /* -------------------------------------------------------
     7. Create actual event start datetime
  ------------------------------------------------------- */

  const eventStartDateTime =
    getEventStartDateTime(
      booking.event.eventDate,
      booking.event.startTime,
    );

  const now = new Date();

  /* -------------------------------------------------------
     8. Don't allow cancellation after event starts
  ------------------------------------------------------- */

  if (
    eventStartDateTime.getTime() <=
    now.getTime()
  ) {
    throw new Error(
      "Booking cannot be cancelled after the event has started",
    );
  }

  /* -------------------------------------------------------
     9. Calculate hours before event
  ------------------------------------------------------- */

  const differenceInMilliseconds =
    eventStartDateTime.getTime() -
    now.getTime();

  const hoursBeforeEvent =
    differenceInMilliseconds /
    (1000 * 60 * 60);

  /* -------------------------------------------------------
     10. Get refund policy from event
  ------------------------------------------------------- */

  // Example:
  // refundWindow = 72
  //
  // Means:
  // cancellation must happen >= 72 hours before event

  const refundWindowHours =
    booking.event.refundWindow ?? 72;

  /* -------------------------------------------------------
     11. Determine refund eligibility
  ------------------------------------------------------- */

  const refundEligible =
    hoursBeforeEvent >=
    refundWindowHours;

  /* -------------------------------------------------------
     12. Calculate refund amount
  ------------------------------------------------------- */

  const paidAmount = Number(
    booking.paidAmount,
  );

  let refundAmount = 0;

  if (
    refundEligible &&
    paidAmount > 0
  ) {
    refundAmount = paidAmount;
  }

  /* -------------------------------------------------------
     13. Determine refund reason
  ------------------------------------------------------- */

  let refundReason: string;

  if (refundEligible) {
    refundReason =
      `Cancellation was requested at least ${refundWindowHours} hours before the event.`;
  } else {
    refundReason =
      `Cancellation was requested less than ${refundWindowHours} hours before the event.`;
  }

  /* -------------------------------------------------------
     14. Determine booking status
  ------------------------------------------------------- */

  let bookingStatus:
    | "CANCELLED"
    | "REFUND_PENDING";

  if (
    refundEligible &&
    refundAmount > 0
  ) {
    bookingStatus =
      "REFUND_PENDING";
  } else {
    bookingStatus =
      "CANCELLED";
  }

  /* -------------------------------------------------------
     15. Refund requested time
  ------------------------------------------------------- */

  const refundRequestedAt =
    refundEligible &&
    refundAmount > 0
      ? now
      : null;

  /* -------------------------------------------------------
     16. Update booking + tickets
  ------------------------------------------------------- */

  const updatedBooking =
    await cancelEventBookingRepository(
      bookingId,
      {
        cancellationReason: reason,

        cancellationComment:
          comment,

        cancelledAt: now,

        refundEligible,

        refundAmount,

        refundReason,

        refundRequestedAt,

        status: bookingStatus,
      },
    );

  /* -------------------------------------------------------
     17. Refund display status
  ------------------------------------------------------- */

  let refundStatus:
    | "NOT_ELIGIBLE"
    | "REFUND_PENDING"
    | "NO_REFUND_REQUIRED";

  if (!refundEligible) {
    refundStatus =
      "NOT_ELIGIBLE";
  } else if (refundAmount > 0) {
    refundStatus =
      "REFUND_PENDING";
  } else {
    refundStatus =
      "NO_REFUND_REQUIRED";
  }

  /* -------------------------------------------------------
     18. Return response
  ------------------------------------------------------- */

  return {
    bookingId:
      updatedBooking.id,

    bookingNumber:
      updatedBooking.bookingNumber,

    bookingStatus:
      updatedBooking.status,

    cancelledAt:
      updatedBooking.cancelledAt,

    cancellation: {
      reason:
        updatedBooking.cancellationReason,

      comment:
        updatedBooking.cancellationComment,
    },

    refund: {
      eligible:
        updatedBooking.refundEligible,

      status:
        refundStatus,

      amount: Number(
        updatedBooking.refundAmount ??
          0,
      ),

      policyHours:
        refundWindowHours,

      hoursBeforeEvent: Number(
        hoursBeforeEvent.toFixed(2),
      ),

      reason:
        updatedBooking.refundReason,
    },

    event: {
      id:
        updatedBooking.event.id,

      title:
        updatedBooking.event.title,

      eventDate:
        updatedBooking.event.eventDate,

      startTime:
        updatedBooking.event.startTime,

      refundWindow:
        updatedBooking.event.refundWindow,
    },
  };
};