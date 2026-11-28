import { Prisma } from "@prisma/client";

import { prisma } from "../../../../prisma/prismaClient";

import {
  GetEventPayoutInput,
  EventPayoutSummary,
  EventPayoutServiceError,
} from "./eventPayout.types";


// ==========================================
// DECIMAL HELPERS
// ==========================================

const decimal = (
  value: Prisma.Decimal | number | string,
) => {
  return new Prisma.Decimal(value);
};


const roundAmount = (
  value: Prisma.Decimal,
) => {
  return value.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
};


const calculatePercentage = (
  amount: Prisma.Decimal,
  percentage: Prisma.Decimal,
) => {
  return roundAmount(
    amount.mul(percentage).div(100),
  );
};


// ==========================================
// GET TODAY'S DATE RANGE - IST
// ==========================================

const getTodayISTRange = () => {
  const now = new Date();

  const istOffset = 330 * 60 * 1000;

  const istNow = new Date(
    now.getTime() + istOffset,
  );

  const startOfToday = new Date(
    Date.UTC(
      istNow.getUTCFullYear(),
      istNow.getUTCMonth(),
      istNow.getUTCDate(),
    ) - istOffset,
  );

  const endOfToday = new Date(
    startOfToday.getTime() +
      24 * 60 * 60 * 1000,
  );

  return {
    startOfToday,
    endOfToday,
  };
};


// ==========================================
// GET EVENT PAYOUT SUMMARY SERVICE
// ==========================================

export const getEventPayoutSummaryService =
  async (
    params: GetEventPayoutInput,
  ) => {

    const {
      businessId,
      eventId,
      eventDateId,
    } = params;

    console.log(
      "[EVENT PAYOUT] Fetching payout summary",
      {
        businessId,
        eventId,
        eventDateId,
      },
    );


    // ==========================================
    // 1. VALIDATE EVENT AND ORGANIZER OWNERSHIP
    // ==========================================

    const event =
      await prisma.event.findFirst({
        where: {
          id: eventId,

          businessDetailsId: businessId,

          isDeleted: false,

          deletedAt: null,
        },

        select: {
          id: true,

          title: true,

          visibility: true,

          status: true,

          eventDurationType: true,

          tripType: true,

          category: true,

          venue: {
            select: {
              venueName: true,

              fullAddress: true,
            },
          },
        },
      });

    if (!event) {
      throw new EventPayoutServiceError(
        404,
        "Event not found or access denied",
      );
    }


    // ==========================================
    // 2. VALIDATE EVENT DATE
    // ==========================================

    const eventDate =
      await prisma.eventDate.findFirst({
        where: {
          id: eventDateId,

          eventId,
        },

        select: {
          id: true,

          startDateTime: true,

          endDateTime: true,

          timezone: true,

          status: true,
        },
      });

    if (!eventDate) {
      throw new EventPayoutServiceError(
        404,
        "Event date not found",
      );
    }


    // ==========================================
    // 3. CHECK WHETHER EVENT IS TODAY
    // ==========================================

    const {
      startOfToday,
      endOfToday,
    } = getTodayISTRange();

    const eventEndDateTime =
      eventDate.endDateTime ??
      eventDate.startDateTime;

    const isToday =
      eventDate.startDateTime < endOfToday &&
      eventEndDateTime >= startOfToday;

    // if (!isToday) {
    //   throw new EventPayoutServiceError(
    //     400,
    //     "Selected event is not scheduled for today",
    //   );
    // }

    if (
      event.status === "CANCELLED" ||
      eventDate.status === "CANCELLED"
    ) {
      throw new EventPayoutServiceError(
        400,
        "Event has been cancelled",
      );
    }


    // ==========================================
    // 4. FETCH GLOBAL AMOUNT CONFIGURATION
    // ==========================================

    const globalAmount =
      await prisma.globalAmount.findFirst({
        orderBy: {
          createdAt: "asc",
        },

        select: {
          gst: true,

          gstTCS: true,

          tds: true,

          welvorsCommission: true,

          eventPlatformFee: true,
        },
      });

    if (!globalAmount) {
      throw new EventPayoutServiceError(
        503,
        "Global amount configuration not found",
      );
    }


    // ==========================================
    // 5. GET PAID EVENT BOOKINGS
    // ==========================================

    const bookings =
      await prisma.eventBooking.findMany({
        where: {
          eventId,

          eventDateId,

          paymentStatus: "PAID",

          status: {
            in: [
              "CONFIRMED",
              "PARTIALLY_CANCELLED",
              "CANCELLED",
              "COMPLETED",
              "ATTENDED",
              "REFUND_PENDING",
              "REFUNDED",
            ],
          },
        },

        select: {
          id: true,

          ticketCount: true,

          ticketAmount: true,

          paidAmount: true,

          refundAmount: true,

          refundStatus: true,

          tickets: {
            select: {
              id: true,

              ticketAmount: true,

              guestCount: true,

              refundedAmount: true,

              status: true,
            },
          },
        },
      });


    // ==========================================
    // 6. CALCULATE TICKET SALES
    // ==========================================

    let grossTicketSales = decimal(0);

    let totalRefundAmount = decimal(0);

    let ticketCount = 0;

    let guestCount = 0;

    for (const booking of bookings) {

      for (const ticket of booking.tickets) {

        grossTicketSales =
          grossTicketSales.add(
            ticket.ticketAmount,
          );

        // Only completed ticket-principal refunds
        // should be recorded in refundedAmount.

        totalRefundAmount =
          totalRefundAmount.add(
            ticket.refundedAmount,
          );

        // Active / valid ticket counts

        if (
          ticket.status !== "CANCELLED" &&
          ticket.status !== "EXPIRED" &&
          ticket.status !== "PENDING"
        ) {
          ticketCount += 1;

          guestCount += ticket.guestCount;
        }
      }
    }

    grossTicketSales =
      roundAmount(grossTicketSales);

    totalRefundAmount =
      roundAmount(totalRefundAmount);

    if (
      totalRefundAmount.gt(grossTicketSales)
    ) {
      throw new EventPayoutServiceError(
        409,
        "Ticket refund amounts require reconciliation",
      );
    }

    const ticketSales = roundAmount(
      grossTicketSales.sub(
        totalRefundAmount,
      ),
    );


    // ==========================================
    // 7. CALCULATE GST INCLUDED IN TICKETS
    // ==========================================

    // Example:
    // 40700 × 18 / 118 = 6208.47

    const ticketGSTAmount = roundAmount(
      ticketSales
        .mul(globalAmount.gst)
        .div(
          decimal(100).add(
            globalAmount.gst,
          ),
        ),
    );

    const taxableTicketSales = roundAmount(
      ticketSales.sub(ticketGSTAmount),
    );


    // ==========================================
    // 8. CALCULATE TDS - SECTION 194-O
    // ==========================================

    const tdsAmount =
      calculatePercentage(
        ticketSales,

        globalAmount.tds,
      );


    // ==========================================
    // 9. CALCULATE GST TCS - SECTION 52
    // ==========================================

    const gstTCSAmount =
      calculatePercentage(
        taxableTicketSales,

        globalAmount.gstTCS,
      );


    // ==========================================
    // 10. CALCULATE WELVORS COMMISSION
    // ==========================================

    const commissionAmount =
      calculatePercentage(
        ticketSales,

        globalAmount.welvorsCommission,
      );


    // ==========================================
    // 11. CALCULATE GST ON COMMISSION
    // ==========================================

    const gstOnCommissionAmount =
      calculatePercentage(
        commissionAmount,

        globalAmount.gst,
      );


    // ==========================================
    // 12. CALCULATE TOTAL DEDUCTIONS
    // ==========================================

    const totalDeductions = roundAmount(
      tdsAmount
        .add(gstTCSAmount)
        .add(commissionAmount)
        .add(gstOnCommissionAmount),
    );


    // ==========================================
    // 13. CALCULATE ORGANIZER RECEIVABLE
    // ==========================================

    const organizerReceivable =
      roundAmount(
        ticketSales.sub(totalDeductions),
      );


 // ==========================================
// 14. RETURN PAYOUT SUMMARY
// ==========================================

return {
  title: "Payout so far",

  ticketSales: {
    label: "Ticket sales",
    ticketCount,
    amount: Number(ticketSales),
  },

  tds: {
    label: "TDS · Sec 194-O",
    percentage: Number(globalAmount.tds),
    amount: Number(tdsAmount),
  },

  gstTCS: {
    label: "GST TCS · Sec 52",
    percentage: Number(globalAmount.gstTCS),
    amount: Number(gstTCSAmount),
  },

  welvorsCommission: {
    label: "Welvors commission",
    percentage: Number(globalAmount.welvorsCommission),
    amount: Number(commissionAmount),
  },

  gstOnCommission: {
    label: "GST on commission",
    percentage: Number(globalAmount.gst),
    amount: Number(gstOnCommissionAmount),
  },

  youReceive: {
    label: "You receive",
    amount: Number(organizerReceivable),
  },

  ticketGST: {
    percentage: Number(globalAmount.gst),
    amount: Number(ticketGSTAmount),
  },

  currency: "INR",

  isEstimated: true,

  note:
    `Includes ₹${Math.round(Number(ticketGSTAmount)).toLocaleString("en-IN")} ` +
    `estimated GST on tickets. Where applicable, ` +
    `you pay it in your GSTR-3B. ` +
    `TCS & TDS are credited to your GSTIN / PAN ` +
    `subject to applicable tax rules.`,
};
  };