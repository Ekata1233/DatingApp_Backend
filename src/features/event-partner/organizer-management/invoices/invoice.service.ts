import { Prisma } from "@prisma/client";
import { GuestInvoiceDetailsQuery, GuestInvoiceDetailsResponse, GuestInvoiceGroup, GuestInvoiceItem, GuestInvoiceQuery, InvoiceQuery, OrganizerTaxReportQuery, OrganizerTaxReportSummary, WelvorsInvoiceItem, WelvorsInvoiceQuery } from "./invoice.types";
import { prisma } from "../../../../prisma/prismaClient";

// ==========================================
// FINANCIAL HELPERS
// ==========================================

const decimal = (
  value: Prisma.Decimal | number | string | null,
) => {
  return new Prisma.Decimal(value ?? 0);
};

const roundAmount = (value: Prisma.Decimal) => {
  return value.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP,
  );
};

const toAmount = (value: Prisma.Decimal) => {
  return roundAmount(value).toNumber();
};

// ==========================================
// INDIA TIMEZONE HELPERS
// ==========================================

const IST_OFFSET_MS = 330 * 60 * 1000;

const getMonthRange = (
  year: number,
  month: number,
) => {
  const startDate = new Date(
    Date.UTC(year, month - 1, 1) -
      IST_OFFSET_MS,
  );

  const endDate = new Date(
    Date.UTC(year, month, 1) -
      IST_OFFSET_MS,
  );

  return {
    startDate,
    endDate,
  };
};

const getMonthLabel = (
  year: number,
  month: number,
) => {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
};

const getCurrentIndiaMonth = () => {
  const now = new Date(
    Date.now() + IST_OFFSET_MS,
  );

  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
};

const getExpectedIssueDate = (
  year: number,
  month: number,
) => {
  return new Date(
    Date.UTC(year, month, 1),
  ).toISOString().slice(0, 10);
};

// ==========================================
// COMMON BOOKING FILTER
// ==========================================

const getPaidBookingWhere = (
  businessId: string,
): Prisma.EventBookingWhereInput => ({
  paymentStatus: "PAID",

  event: {
    businessDetailsId: businessId,
  },
});

// ==========================================
// COMMON REFUND FILTER
// ==========================================

const successfulRefundStatuses: Prisma.EventBookingWhereInput =
  {
    refundStatus: {
      in: [
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
    },
  };

  const getMonthlyFinancialSummary = async (
  businessId: string,
  year: number,
  month: number,
) => {
  const {
    startDate,
    endDate,
  } = getMonthRange(year, month);

  const bookingWhere =
    getPaidBookingWhere(businessId);

  // ==========================================
  // SALES FILTER
  // ==========================================

  const salesWhere: Prisma.EventBookingWhereInput =
    {
      ...bookingWhere,

      confirmedAt: {
        gte: startDate,
        lt: endDate,
      },
    };

  // ==========================================
  // REFUNDS FILTER
  // ==========================================

  const refundWhere: Prisma.EventBookingWhereInput =
    {
      ...bookingWhere,

      ...successfulRefundStatuses,

      refundedAt: {
        gte: startDate,
        lt: endDate,
      },
    };

  // ==========================================
  // FETCH MONTHLY DATA
  // ==========================================

  const [
    sales,
    refunds,
    eventGroups,
    agreements,
  ] = await prisma.$transaction([
    prisma.eventBooking.aggregate({
      where: salesWhere,

      _sum: {
        ticketAmount: true,
      },

      _count: {
        _all: true,
      },
    }),

    prisma.eventBooking.aggregate({
      where: refundWhere,

      _sum: {
        refundAmount: true,
      },
    }),

    prisma.eventBooking.groupBy({
      by: ["eventId"],

      where: salesWhere,
      orderBy: {
    eventId: "asc",
  },
    }),

    prisma.partnerAgreement.findMany({
      where: {
        businessId,

        status: {
          in: [
            "SIGNED",
            "EXPIRED",
            "TERMINATED",
          ],
        },

        signedAt: {
          not: null,
        },

        effectiveFrom: {
          lt: endDate,
        },

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gt: startDate,
                },
              },
            ],
          },
          {
            OR: [
              {
                terminatedAt: null,
              },
              {
                terminatedAt: {
                  gt: startDate,
                },
              },
            ],
          },
        ],
      },

      orderBy: {
        effectiveFrom: "desc",
      },

      select: {
        id: true,
        effectiveFrom: true,
        expiresAt: true,
        terminatedAt: true,
        commissionPercentage: true,
        commissionGst: true,
        tdsPercentage: true,
      },
    }),
  ]);

  // ==========================================
  // CALCULATE NET SALES
  // ==========================================

  const grossTicketSales = decimal(
    sales._sum.ticketAmount,
  );

  const refundAmount = decimal(
    refunds._sum.refundAmount,
  );

  const netTicketSales =
    grossTicketSales.minus(refundAmount);

  // ==========================================
  // VALIDATE AGREEMENT PERIOD
  // ==========================================

  const agreement =
    agreements.length === 1
      ? agreements[0]
      : null;

  const agreementCoversMonth =
    agreement !== null &&
    agreement.effectiveFrom !== null &&
    agreement.effectiveFrom <= startDate &&
    (
      !agreement.expiresAt ||
      agreement.expiresAt >= endDate
    ) &&
    (
      !agreement.terminatedAt ||
      agreement.terminatedAt >= endDate
    );

  // ==========================================
  // COMMISSION CALCULATION
  // ==========================================

  const commissionPercentage =
    agreementCoversMonth && agreement
      ? agreement.commissionPercentage
      : null;

  const commissionGstPercentage =
    agreementCoversMonth && agreement
      ? agreement.commissionGst
      : null;

  const commissionAmount =
    commissionPercentage !== null
      ? roundAmount(
          netTicketSales
            .mul(commissionPercentage)
            .div(100),
        )
      : null;

  const commissionGstAmount =
    commissionAmount !== null &&
    commissionGstPercentage !== null
      ? roundAmount(
          commissionAmount
            .mul(commissionGstPercentage)
            .div(100),
        )
      : null;

  const invoiceTotal =
    commissionAmount !== null &&
    commissionGstAmount !== null
      ? commissionAmount.plus(
          commissionGstAmount,
        )
      : null;

  // ==========================================
  // RETURN MONTHLY SUMMARY
  // ==========================================

  return {
    month,
    year,

    monthLabel:
      getMonthLabel(year, month),

    startDate,
    endDate,

    eventCount:
      eventGroups.length,

    bookingCount:
      sales._count._all,

    grossTicketSales:
      toAmount(grossTicketSales),

    refundAmount:
      toAmount(refundAmount),

    netTicketSales:
      toAmount(netTicketSales),

    commissionPercentage:
      commissionPercentage?.toNumber() ??
      null,

    commissionAmount:
      commissionAmount !== null
        ? toAmount(commissionAmount)
        : null,

    commissionGstPercentage:
      commissionGstPercentage?.toNumber() ??
      null,

    commissionGstAmount:
      commissionGstAmount !== null
        ? toAmount(commissionGstAmount)
        : null,

    invoiceTotal:
      invoiceTotal !== null
        ? toAmount(invoiceTotal)
        : null,

    agreementFound:
      agreementCoversMonth,

    isEstimated: true,
  };
};

// export const getGuestInvoicesService = async (
//   businessId: string,
//   query: GuestInvoiceQuery,
// ) => {
//   const {
//     page,
//     limit,
//     invoiceLimit,
//     search,
//   } = query;

//   const skip = (page - 1) * limit;

//   // Only successfully paid bookings
//   const bookingWhere: Prisma.EventBookingWhereInput = {
//     paymentStatus: "PAID",
//   };

//   // Successfully processed full or partial refunds
//   const refundWhere: Prisma.EventBookingWhereInput = {
//     ...bookingWhere,

//     refundStatus: {
//       in: [
//         "REFUNDED",
//         "PARTIALLY_REFUNDED",
//       ],
//     },
//   };

//   // Particular organizer's event dates
//   const where: Prisma.EventDateWhereInput = {
//     event: {
//       businessDetailsId: businessId,

//       ...(search && {
//         title: {
//           contains: search,
//           mode: "insensitive",
//         },
//       }),
//     },

//     bookings: {
//       some: bookingWhere,
//     },
//   };

//   const [business, total, eventDates] =
//     await prisma.$transaction([
//       // Organizer details
//       prisma.businessDetails.findUnique({
//         where: {
//           id: businessId,
//         },

//         select: {
//           id: true,
//           legalName: true,
//           brandName: true,
//           gstNumber: true,
//         },
//       }),

//       // Total event groups
//       prisma.eventDate.count({
//         where,
//       }),

//       // Event-wise guest invoice summaries
//       prisma.eventDate.findMany({
//         where,
//         skip,
//         take: limit,

//         orderBy: [
//           { startDateTime: "desc" },
//           { id: "desc" },
//         ],

//         select: {
//           id: true,
//           eventId: true,
//           startDateTime: true,

//           event: {
//             select: {
//               id: true,
//               title: true,
//               eventDurationType: true,

//               photos: {
//                 where: {
//                   photoType: "EVENT",
//                 },

//                 orderBy: {
//                   sortOrder: "asc",
//                 },

//                 take: 1,

//                 select: {
//                   photoUrl: true,
//                 },
//               },
//             },
//           },

//           // Total paid bookings
//           _count: {
//             select: {
//               bookings: {
//                 where: bookingWhere,
//               },
//             },
//           },

//           // First 6 bookings by default
//           bookings: {
//             where: bookingWhere,

//             take: invoiceLimit,

//             orderBy: [
//               { confirmedAt: "asc" },
//               { id: "asc" },
//             ],

//             select: {
//               id: true,
//               bookingNumber: true,
//               totalAmount: true,
//               gstAmount: true,
//               paidAmount: true,
//               refundAmount: true,
//               refundStatus: true,
//               confirmedAt: true,
//               createdAt: true,

//               user: {
//                 select: {
//                   full_name: true,
//                 },
//               },

//               tickets: {
//                 select: {
//                   guests: {
//                     where: {
//                       isPrimaryGuest: true,
//                     },

//                     orderBy: {
//                       id: "asc",
//                     },

//                     take: 1,

//                     select: {
//                       fullName: true,
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       }),
//     ]);

//   if (!business) {
//     return null;
//   }

//   const eventDateIds = eventDates.map(
//     (eventDate) => eventDate.id,
//   );

//   // Count refunded bookings for all returned event dates
//   const refundCounts =
//     await prisma.eventBooking.groupBy({
//       by: ["eventDateId"],

//       where: {
//         ...refundWhere,

//         eventDateId: {
//           in: eventDateIds,
//         },

//         event: {
//           businessDetailsId: businessId,
//         },
//       },

//       _count: {
//         _all: true,
//       },
//     });

//   const refundCountMap = new Map(
//     refundCounts.map((item) => [
//       item.eventDateId,
//       item._count._all,
//     ]),
//   );

//   // Prepare frontend response
//   const items: GuestInvoiceGroup[] =
//     eventDates.map((eventDate) => {
//       const invoiceCount =
//         eventDate._count.bookings;

//       const refundedBookingCount =
//         refundCountMap.get(eventDate.id) ?? 0;

//       const invoices: GuestInvoiceItem[] =
//         eventDate.bookings.map((booking) => {
//           const primaryGuest = booking.tickets
//             .flatMap((ticket) => ticket.guests)
//             .find((guest) => guest.fullName);

//           const isRefunded =
//             booking.refundStatus === "REFUNDED" ||
//             booking.refundStatus ===
//               "PARTIALLY_REFUNDED";

//           return {
//             bookingId: booking.id,

//             bookingNumber: booking.bookingNumber,

//             guestName:
//               primaryGuest?.fullName ||
//               booking.user.full_name ||
//               "Guest",

//             bookingDate:
//               booking.confirmedAt ??
//               booking.createdAt,

//             totalAmount: Number(
//               booking.totalAmount,
//             ),

//             gstAmount: Number(
//               booking.gstAmount,
//             ),

//             paidAmount: Number(
//               booking.paidAmount,
//             ),

//             refundAmount: Number(
//               booking.refundAmount ?? 0,
//             ),

//             refundStatus: booking.refundStatus,

//             isRefunded,
//           };
//         });

//       return {
//         eventId: eventDate.eventId,

//         eventDateId: eventDate.id,

//         eventTitle: eventDate.event.title,

//         eventPhotoUrl:
//           eventDate.event.photos[0]?.photoUrl ??
//           null,

//         eventDate: eventDate.startDateTime,

//         invoiceCount,

//         refundedBookingCount,

//         remainingCount: Math.max(
//           0,
//           invoiceCount - invoices.length,
//         ),

//         invoices,
//       };
//     });

//   return {
//     organizer: {
//       businessId: business.id,
//       legalName: business.legalName,
//       brandName: business.brandName,
//       gstin: business.gstNumber,
//     },

//     items,

//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages: Math.ceil(total / limit),
//       hasNextPage: page * limit < total,
//     },
//   };
// };

export const getInvoicesService = async (
  businessId: string,
  query: InvoiceQuery,
) => {
  switch (query.type) {
    case "guest":
      return getGuestInvoicesService(
        businessId,
        query,
      );

    case "welvors":
      return getWelvorsInvoicesService(
        businessId,
        query,
      );

    case "tax-report":
      return getOrganizerTaxReportService(
        businessId,
        query,
      );

    default:
      throw new Error(
        "Invalid invoice type",
      );
  }
};

export const getGuestInvoicesService = async (
  businessId: string,
  query: GuestInvoiceQuery,
) => {
  const {
    page,
    limit,
    invoiceLimit,
    search,
  } = query;

  const skip = (page - 1) * limit;

  // ==========================================
  // BOOKING FILTER
  // ==========================================

  const bookingWhere =
    getPaidBookingWhere(businessId);

  const refundWhere: Prisma.EventBookingWhereInput =
    {
      ...bookingWhere,
      ...successfulRefundStatuses,
    };

  // ==========================================
  // EVENT DATE FILTER
  // ==========================================

  const eventDateWhere: Prisma.EventDateWhereInput =
    {
      event: {
        businessDetailsId: businessId,

        ...(search
          ? {
              title: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {}),
      },

      bookings: {
        some: bookingWhere,
      },
    };

  // ==========================================
  // FETCH DATA
  // ==========================================

  const [
    business,
    total,
    eventDates,
  ] = await prisma.$transaction([
    prisma.businessDetails.findUnique({
      where: {
        id: businessId,
      },

      select: {
        id: true,
        legalName: true,
        brandName: true,
        gstNumber: true,
      },
    }),

    prisma.eventDate.count({
      where: eventDateWhere,
    }),

    prisma.eventDate.findMany({
      where: eventDateWhere,

      skip,
      take: limit,

      orderBy: [
        {
          startDateTime: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        id: true,
        eventId: true,
        startDateTime: true,

        event: {
          select: {
            id: true,
            title: true,

            photos: {
              where: {
                photoType: "EVENT",
              },

              orderBy: {
                sortOrder: "asc",
              },

              take: 1,

              select: {
                photoUrl: true,
              },
            },
          },
        },

        _count: {
          select: {
            bookings: {
              where: bookingWhere,
            },
          },
        },

        bookings: {
          where: bookingWhere,

          take: invoiceLimit,

          orderBy: [
            {
              confirmedAt: "asc",
            },
            {
              id: "asc",
            },
          ],

          select: {
            id: true,
            bookingNumber: true,
            totalAmount: true,
            gstAmount: true,
            paidAmount: true,
            refundAmount: true,
            refundStatus: true,
            confirmedAt: true,
            createdAt: true,

            user: {
              select: {
                full_name: true,
              },
            },

            tickets: {
              orderBy: {
                id: "asc",
              },

              select: {
                guests: {
                  where: {
                    isPrimaryGuest: true,
                  },

                  orderBy: {
                    id: "asc",
                  },

                  take: 1,

                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  if (!business) {
    return null;
  }

  // ==========================================
  // REFUNDED BOOKING COUNTS
  // ==========================================

  const eventDateIds = eventDates.map(
    (eventDate) => eventDate.id,
  );

  const refundCounts =
    await prisma.eventBooking.groupBy({
      by: ["eventDateId"],

      where: {
        ...refundWhere,

        eventDateId: {
          in: eventDateIds,
        },
      },

      _count: {
        _all: true,
      },
    });

  const refundCountMap = new Map(
    refundCounts.map((item) => [
      item.eventDateId,
      item._count._all,
    ]),
  );

  // ==========================================
  // PREPARE RESPONSE
  // ==========================================

  const items: GuestInvoiceGroup[] =
    eventDates.map((eventDate) => {
      const invoices: GuestInvoiceItem[] =
        eventDate.bookings.map((booking) => {
          const primaryGuest = booking.tickets
            .flatMap((ticket) => ticket.guests)
            .find((guest) => guest.fullName);

          const isRefunded =
            booking.refundStatus === "REFUNDED" ||
            booking.refundStatus ===
              "PARTIALLY_REFUNDED";

          return {
            bookingId: booking.id,

            bookingNumber:
              booking.bookingNumber,

            guestName:
              primaryGuest?.fullName ||
              booking.user.full_name ||
              "Guest",

            bookingDate:
              booking.confirmedAt ??
              booking.createdAt,

            totalAmount:
              Number(booking.totalAmount),

            gstAmount:
              Number(booking.gstAmount),

            paidAmount:
              Number(booking.paidAmount),

            refundAmount:
              Number(booking.refundAmount ?? 0),

            refundStatus:
              booking.refundStatus,

            isRefunded,
          };
        });

      const invoiceCount =
        eventDate._count.bookings;

      return {
        eventId: eventDate.eventId,

        eventDateId: eventDate.id,

        eventTitle: eventDate.event.title,

        eventPhotoUrl:
          eventDate.event.photos[0]?.photoUrl ??
          null,

        eventDate: eventDate.startDateTime,

        invoiceCount,

        refundedBookingCount:
          refundCountMap.get(eventDate.id) ?? 0,

        remainingCount: Math.max(
          0,
          invoiceCount - invoices.length,
        ),

        invoices,
      };
    });

  return {
    organizer: {
      businessId: business.id,
      legalName: business.legalName,
      brandName: business.brandName,
      gstin: business.gstNumber,
    },

    items,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),

      hasNextPage:
        page * limit < total,
    },
  };
};

export const getWelvorsInvoicesService = async (
  businessId: string,
  query: WelvorsInvoiceQuery,
) => {
  const { year, month } = query;

  const current =
    getCurrentIndiaMonth();

  // ==========================================
  // FETCH BUSINESS
  // ==========================================

  const business =
    await prisma.businessDetails.findUnique({
      where: {
        id: businessId,
      },

      select: {
        id: true,
        legalName: true,
        brandName: true,
        gstNumber: true,
      },
    });

  if (!business) {
    return null;
  }

  // ==========================================
  // PREPARE MONTHS
  // ==========================================

  let months: number[] = [];

  if (month !== undefined) {
    months = [month];
  } else {
    const lastMonth =
      year < current.year
        ? 12
        : year === current.year
          ? current.month
          : 0;

    months = Array.from(
      {
        length: lastMonth,
      },
      (_, index) => lastMonth - index,
    );
  }

  // ==========================================
  // FETCH MONTHLY SUMMARIES
  // ==========================================

  const items: WelvorsInvoiceItem[] = [];

  for (const selectedMonth of months) {
    const summary =
      await getMonthlyFinancialSummary(
        businessId,
        year,
        selectedMonth,
      );

    const isUpcoming =
      summary.endDate.getTime() >
      Date.now();

    items.push({
      month: selectedMonth,

      year,

      monthLabel:
        summary.monthLabel,

      // Official invoice not generated yet
      invoiceNumber: null,

      issuedAt: null,

      expectedIssueDate:
        getExpectedIssueDate(
          year,
          selectedMonth,
        ),

      status:
        isUpcoming
          ? "UPCOMING"
          : "ESTIMATED",

      eventCount:
        summary.eventCount,

      commissionPercentage:
        summary.commissionPercentage,

      commissionAmount:
        summary.commissionAmount,

      gstPercentage:
        summary.commissionGstPercentage,

      gstAmount:
        summary.commissionGstAmount,

      invoiceTotal:
        summary.invoiceTotal,
    });
  }

  // ==========================================
  // FINAL RESPONSE
  // ==========================================

  return {
    supplierName:
      "Infynod Tech Pvt Ltd",

    supplierBrandName:
      "Welvors",

    currency: "INR",

    organizer: {
      businessId: business.id,

      legalName:
        business.legalName,

      brandName:
        business.brandName,

      gstin:
        business.gstNumber,
    },

    year,

    total: items.length,

    isEstimated: true,

    items,
  };
};

export const getOrganizerTaxReportService = async (
  businessId: string,
  query: OrganizerTaxReportQuery,
) => {
  const {
    month,
    year,
  } = query;

  // ==========================================
  // FETCH ORGANIZER
  // ==========================================

  const business =
    await prisma.businessDetails.findUnique({
      where: {
        id: businessId,
      },

      select: {
        id: true,
        legalName: true,
        brandName: true,
        hasGst: true,
        gstNumber: true,
        gstVerificationStatus: true,
      },
    });

  if (!business) {
    return null;
  }

  // ==========================================
  // GET MONTHLY FINANCIAL SUMMARY
  // ==========================================

  const monthlySummary =
    await getMonthlyFinancialSummary(
      businessId,
      year,
      month,
    );

  // ==========================================
  // ESTIMATED SALES GST
  // ==========================================

  const isGstRegistered =
    business.hasGst === true &&
    Boolean(business.gstNumber) &&
    business.gstVerificationStatus ===
      "VERIFIED";

  // Assumption: all organizer ticket sales
  // are GST-inclusive and taxable at 18%.

  const salesGstPercentage =
    isGstRegistered ? 18 : null;

  const netTicketSales = decimal(
    monthlySummary.netTicketSales,
  );

  const taxableValue =
    salesGstPercentage !== null
      ? roundAmount(
          netTicketSales
            .mul(100)
            .div(100 + salesGstPercentage),
        )
      : null;

  const salesGstAmount =
    taxableValue !== null
      ? netTicketSales.minus(taxableValue)
      : null;

  // ==========================================
  // PREPARE TAX SUMMARY
  // ==========================================

  const summary: OrganizerTaxReportSummary = {
    grossTicketSales:
      monthlySummary.grossTicketSales,

    refundAmount:
      monthlySummary.refundAmount,

    netTicketSales:
      monthlySummary.netTicketSales,

    taxableValue:
      taxableValue !== null
        ? toAmount(taxableValue)
        : null,

    salesGstPercentage,

    salesGstAmount:
      salesGstAmount !== null
        ? toAmount(salesGstAmount)
        : null,

    // Actual deductions are not available
    // in the supplied schema.

    gstTcsDeducted: null,

    tdsDeducted: null,

    commissionAmount:
      monthlySummary.commissionAmount,

    commissionGstAmount:
      monthlySummary.commissionGstAmount,
  };

  // ==========================================
  // FINAL RESPONSE
  // ==========================================

  return {
    month,

    year,

    monthLabel:
      monthlySummary.monthLabel,

    currency: "INR",

    organizer: {
      businessId: business.id,

      legalName:
        business.legalName,

      brandName:
        business.brandName,

      gstin:
        business.gstNumber,

      isGstRegistered,
    },

    eventCount:
      monthlySummary.eventCount,

    bookingCount:
      monthlySummary.bookingCount,

    summary,

    isEstimated: true,

    notes: [
      "This report contains estimated financial amounts.",

      "GST calculations assume GST-inclusive ticket sales at a uniform rate of 18%.",

      "Actual GST TCS and TDS deductions are not available.",

      "Commission GST input credit is subject to valid tax invoices and applicable eligibility.",

      "Reconcile this report with your accountant before filing tax returns.",
    ],
  };
};

export const getGuestInvoiceDetailsService = async (
  businessId: string,
  eventDateId: string,
  query: GuestInvoiceDetailsQuery,
): Promise<GuestInvoiceDetailsResponse | null> => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  // ==========================================
  // VALIDATE EVENT DATE AND ORGANIZER OWNERSHIP
  // ==========================================

  const eventDate = await prisma.eventDate.findFirst({
    where: {
      id: eventDateId,

      event: {
        businessDetailsId: businessId,
      },
    },

    select: {
      id: true,
      eventId: true,
      startDateTime: true,

      event: {
        select: {
          id: true,
          title: true,

          photos: {
            where: {
              photoType: "EVENT",
            },

            orderBy: {
              sortOrder: "asc",
            },

            take: 1,

            select: {
              photoUrl: true,
            },
          },
        },
      },
    },
  });

  if (!eventDate) {
    return null;
  }

  // ==========================================
  // PAID BOOKING FILTER
  // ==========================================

  const bookingWhere: Prisma.EventBookingWhereInput = {
    eventDateId,

    eventId: eventDate.eventId,

    paymentStatus: "PAID",

    event: {
      businessDetailsId: businessId,
    },
  };

  // ==========================================
  // REFUNDED BOOKING FILTER
  // ==========================================

  const refundWhere: Prisma.EventBookingWhereInput = {
    ...bookingWhere,

    refundStatus: {
      in: [
        "REFUNDED",
        "PARTIALLY_REFUNDED",
      ],
    },
  };

  // ==========================================
  // FETCH COUNTS AND PAGINATED BOOKINGS
  // ==========================================

  const [
    invoiceCount,
    refundedBookingCount,
    bookings,
  ] = await prisma.$transaction([
    prisma.eventBooking.count({
      where: bookingWhere,
    }),

    prisma.eventBooking.count({
      where: refundWhere,
    }),

    prisma.eventBooking.findMany({
      where: bookingWhere,

      skip,
      take: limit,

      orderBy: [
        { confirmedAt: "asc" },
        { id: "asc" },
      ],

      select: {
        id: true,
        bookingNumber: true,
        totalAmount: true,
        gstAmount: true,
        paidAmount: true,
        refundAmount: true,
        refundStatus: true,
        confirmedAt: true,
        createdAt: true,

        user: {
          select: {
            full_name: true,
          },
        },

        tickets: {
          orderBy: {
            id: "asc",
          },

          select: {
            guests: {
              where: {
                isPrimaryGuest: true,
              },

              orderBy: {
                id: "asc",
              },

              take: 1,

              select: {
                fullName: true,
              },
            },
          },
        },
      },
    }),
  ]);

  // ==========================================
  // PREPARE INVOICE ITEMS
  // ==========================================

  const invoices: GuestInvoiceItem[] = bookings.map(
    (booking) => {
      const primaryGuest = booking.tickets
        .flatMap((ticket) => ticket.guests)
        .find((guest) => guest.fullName);

      const isRefunded =
        booking.refundStatus === "REFUNDED" ||
        booking.refundStatus === "PARTIALLY_REFUNDED";

      return {
        bookingId: booking.id,

        bookingNumber: booking.bookingNumber,

        guestName:
          primaryGuest?.fullName ||
          booking.user.full_name ||
          "Guest",

        bookingDate:
          booking.confirmedAt ??
          booking.createdAt,

        totalAmount: Number(
          booking.totalAmount,
        ),

        gstAmount: Number(
          booking.gstAmount,
        ),

        paidAmount: Number(
          booking.paidAmount,
        ),

        refundAmount: Number(
          booking.refundAmount ?? 0,
        ),

        refundStatus: booking.refundStatus,

        isRefunded,
      };
    },
  );

  // ==========================================
  // FINAL RESPONSE
  // ==========================================

  return {
    eventId: eventDate.eventId,

    eventDateId: eventDate.id,

    eventTitle: eventDate.event.title,

    eventPhotoUrl:
      eventDate.event.photos[0]?.photoUrl ?? null,

    eventDate: eventDate.startDateTime,

    invoiceCount,

    refundedBookingCount,

    remainingCount: Math.max(
      0,
      invoiceCount - skip - invoices.length,
    ),

    invoices,

    pagination: {
      page,
      limit,

      total: invoiceCount,

      totalPages: Math.ceil(
        invoiceCount / limit,
      ),

      hasNextPage:
        page * limit < invoiceCount,
    },
  };
};