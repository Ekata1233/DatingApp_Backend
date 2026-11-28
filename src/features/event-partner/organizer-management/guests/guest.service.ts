import {
  Prisma,
  EventBookingStatus,
  EventBookingPaymentStatus,
  EventTicketStatus,
} from "@prisma/client";

import {
  GetGuestListParams,
  GuestListItem,
  GuestAttendanceStatus,
  GuestPermissions,
  GuestGenderCounts,
} from "./guest.types";
import { prisma } from "../../../../prisma/prismaClient";

// ========================================
// CUSTOM ERROR
// ========================================

export class GuestListError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "GuestListError";
  }
}

const validateGuestListAccess = async (
  params: GetGuestListParams,
): Promise<GuestPermissions> => {
  const { partnerId, businessId, role, eventId } = params;

  // Organizer has full guest management access
  if (role === "ORGANIZER") {
    return {
      canViewGuestList: true,
      canCheckInGuests: true,
    };
  }

  // Only organizer and host are allowed
  if (role !== "HOST") {
    throw new GuestListError("Access denied", 403);
  }

  // Find authenticated host
  const host = await prisma.host.findFirst({
    where: {
      partnerId,
      businessId,
    },

    select: {
      id: true,
      status: true,
      onboardingCompleted: true,
      removedAt: true,
      canViewGuestList: true,
      canCheckInGuests: true,
    },
  });

  if (!host) {
    throw new GuestListError("Host profile not found", 403);
  }

  // Validate host account status
  if (host.status !== "ACTIVE" || host.removedAt !== null) {
    throw new GuestListError("Host account is not active", 403);
  }

  // Validate onboarding
  if (!host.onboardingCompleted) {
    throw new GuestListError("Please complete host onboarding", 403);
  }

  // Validate guest list permission
  if (!host.canViewGuestList) {
    throw new GuestListError(
      "You do not have permission to view the guest list",
      403,
    );
  }

  // Validate event assignment
  const assignedEvent = await prisma.event.findFirst({
    where: {
      id: eventId,
      businessDetailsId: businessId,
      isDeleted: false,
      deletedAt: null,

      hostId: host.id,
    },

    select: {
      id: true,
    },
  });

  if (!assignedEvent) {
    throw new GuestListError("You are not assigned to this event", 403);
  }

  return {
    canViewGuestList: host.canViewGuestList,
    canCheckInGuests: host.canCheckInGuests,
  };
};

// ========================================
// GET INITIALS
// ========================================

const getInitials = (fullName: string): string => {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name.charAt(0).toUpperCase())
    .join("");
};

// ========================================
// GET BOOKING LABEL - IST
// ========================================

const getBookedLabel = (bookedAt: Date): string => {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const today = formatter.format(new Date());
  const bookingDay = formatter.format(bookedAt);

  const difference = Math.floor(
    (new Date(`${today}T00:00:00Z`).getTime() -
      new Date(`${bookingDay}T00:00:00Z`).getTime()) /
      86400000,
  );

  if (difference <= 0) {
    return "Today";
  }

  if (difference === 1) {
    return "Yesterday";
  }

  return `${difference}d ago`;
};

// ========================================
// GET GUEST LIST SERVICE
// ========================================

export const getGuestListService = async (params: GetGuestListParams) => {
  const { businessId, eventId, eventDateId, type, search, page, limit } =
    params;

  const skip = (page - 1) * limit;

  // ======================================
  // 1. VALIDATE EVENT OWNERSHIP
  // ======================================

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      businessDetailsId: businessId,
      isDeleted: false,
      deletedAt: null,
    },

    select: {
      id: true,
      title: true,
      status: true,
      eventDurationType: true,
      tripType: true,

      venue: {
        select: {
          venueName: true,
          fullAddress: true,
        },
      },

      tripDetails: {
        select: {
          pickupPoint: true,
          destinationPlace: true,
        },
      },
    },
  });

  if (!event) {
    throw new GuestListError("Event not found or access denied", 404);
  }

  // Validate organizer / host access
  const permissions = await validateGuestListAccess(params);

  // ======================================
  // 2. VALIDATE EVENT DATE
  // ======================================

  const eventDate = await prisma.eventDate.findFirst({
    where: {
      id: eventDateId,
      eventId,
    },

    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      gateOpensAt: true,
      timezone: true,
      status: true,
      totalGuestCapacity: true,
    },
  });

  if (!eventDate) {
    throw new GuestListError("Event date not found", 404);
  }

  // ======================================
  // 3. BASE WHERE CONDITION
  // ======================================

  const baseWhere: Prisma.EventBookingGuestWhereInput = {
    bookingTicket: {
      booking: {
        eventId,
        eventDateId,
      },
    },
  };

  // ======================================
  // 4. VALID BOOKED GUESTS
  // ======================================

  const bookedWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [
      baseWhere,

      {
        bookingTicket: {
          status: {
            in: [
              EventTicketStatus.CONFIRMED,
              EventTicketStatus.CHECKED_IN,
              EventTicketStatus.CHECKED_OUT,
              EventTicketStatus.ATTENDED,
              EventTicketStatus.NO_SHOW,
            ],
          },

          booking: {
            paymentStatus: EventBookingPaymentStatus.PAID,

            status: {
              in: [
                EventBookingStatus.CONFIRMED,
                EventBookingStatus.PARTIALLY_CANCELLED,
                EventBookingStatus.COMPLETED,
                EventBookingStatus.ATTENDED,
              ],
            },
          },
        },
      },
    ],
  };

  // ======================================
  // 5. CHECKED-IN GUESTS
  // ======================================

  const checkedInWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [
      bookedWhere,
      {
        checkedInAt: {
          not: null,
        },
      },
    ],
  };

  // ======================================
  // 6. NOT ARRIVED GUESTS
  // ======================================

  const notArrivedWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [
      bookedWhere,
      {
        checkedInAt: null,
        isNoShow: false,
      },
      {
        bookingTicket: {
          status: {
            not: EventTicketStatus.NO_SHOW,
          },
        },
      },
    ],
  };

  // ======================================
  // 7. CANCELLED GUESTS
  // ======================================

  const cancelledWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [
      baseWhere,

      {
        OR: [
          {
            bookingTicket: {
              status: EventTicketStatus.CANCELLED,
            },
          },

          {
            bookingTicket: {
              booking: {
                status: {
                  in: [
                    EventBookingStatus.CANCELLED,
                    EventBookingStatus.REFUNDED,
                  ],
                },
              },
            },
          },
        ],
      },
    ],
  };

  // ======================================
  // 8. NO-SHOW GUESTS
  // ======================================

  const noShowWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [
      bookedWhere,
      {
        checkedInAt: null,
      },
      {
        OR: [
          {
            isNoShow: true,
          },
          {
            bookingTicket: {
              status: EventTicketStatus.NO_SHOW,
            },
          },
        ],
      },
    ],
  };

  // ======================================
  // 9. ALL GUESTS
  // ======================================

  const allWhere: Prisma.EventBookingGuestWhereInput = {
    OR: [bookedWhere, cancelledWhere],
  };

  // ======================================
  // 10. TYPE FILTER
  // ======================================

  let selectedWhere: Prisma.EventBookingGuestWhereInput;

  switch (type) {
    case "checked_in":
      selectedWhere = checkedInWhere;
      break;

    case "not_arrived":
      selectedWhere = notArrivedWhere;
      break;

    case "cancelled":
      selectedWhere = cancelledWhere;
      break;

    case "all":
    default:
      selectedWhere = allWhere;
      break;
  }

  // ======================================
  // 11. SEARCH FILTER
  // ======================================

  const searchWhere: Prisma.EventBookingGuestWhereInput = search
    ? {
        OR: [
          {
            fullName: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            bookingTicket: {
              ticketId: {
                contains: search,
                mode: "insensitive",
              },
            },
          },

          {
            bookingTicket: {
              booking: {
                bookingNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      }
    : {};

  const finalWhere: Prisma.EventBookingGuestWhereInput = {
    AND: [selectedWhere, searchWhere],
  };

  // ======================================
  // 12. FETCH COUNTS AND GUESTS
  // ======================================

  const [
    allCount,
    bookedCount,
    checkedInCount,
    notArrivedCount,
    cancelledCount,
    noShowCount,
    filteredCount,
    guests,
  ] = await prisma.$transaction(
    [
      prisma.eventBookingGuest.count({
        where: allWhere,
      }),

      prisma.eventBookingGuest.count({
        where: bookedWhere,
      }),

      prisma.eventBookingGuest.count({
        where: checkedInWhere,
      }),

      prisma.eventBookingGuest.count({
        where: notArrivedWhere,
      }),

      prisma.eventBookingGuest.count({
        where: cancelledWhere,
      }),

      prisma.eventBookingGuest.count({
        where: noShowWhere,
      }),

      prisma.eventBookingGuest.count({
        where: finalWhere,
      }),

      prisma.eventBookingGuest.findMany({
        where: finalWhere,

        skip,
        take: limit,

        orderBy: [
          {
            fullName: "asc",
          },
          {
            id: "asc",
          },
        ],

        select: {
          id: true,
          userId: true,
          fullName: true,
          age: true,
          gender: true,
          isPrimaryGuest: true,
          checkedInAt: true,
          checkedOutAt: true,
          isNoShow: true,

          bookingTicket: {
            select: {
              id: true,
              ticketId: true,
              ticketType: true,
              status: true,

              booking: {
                select: {
                  id: true,
                  bookingNumber: true,
                  status: true,
                  paymentStatus: true,
                  createdAt: true,
                },
              },
            },
          },
        },
      }),
    ],

    {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    },
  );

  // ======================================
  // 13. CHECK-IN AVAILABILITY
  // ======================================

  const now = new Date();

  const checkInOpensAt = eventDate.gateOpensAt ?? eventDate.startDateTime;

  const isCheckInOpen =
    event.status === "PUBLISHED" &&
    eventDate.status === "SCHEDULED" &&
    now >= checkInOpensAt &&
    (!eventDate.endDateTime || now < eventDate.endDateTime);

  // ========================================
  // FIRST WELVORS EVENT CHECK
  // ========================================

  const guestUserIds = [
    ...new Set(
      guests
        .map((guest) => guest.userId)
        .filter((userId): userId is string => userId !== null),
    ),
  ];

  const previousAttendees =
    guestUserIds.length > 0
      ? await prisma.eventBookingGuest.findMany({
          where: {
            userId: {
              in: guestUserIds,
            },

            checkedInAt: {
              not: null,
            },

            bookingTicket: {
              booking: {
                eventDateId: {
                  not: eventDateId,
                },

                eventDate: {
                  startDateTime: {
                    lt: eventDate.startDateTime,
                  },
                },
              },
            },
          },

          select: {
            userId: true,
          },

          distinct: ["userId"],
        })
      : [];

  const previousAttendeeIds = new Set(
    previousAttendees.map((guest) => guest.userId),
  );

  // ========================================
  // GENDER-WISE BOOKED GUEST COUNTS
  // ========================================

  const genderGroups = await prisma.eventBookingGuest.groupBy({
    by: ["gender"],

    where: bookedWhere,

    _count: {
      _all: true,
    },

    orderBy: {
      gender: "asc",
    },
  });

  const genderCounts: GuestGenderCounts = {
    women: 0,
    men: 0,
    other: 0,
    unknown: 0,
  };

  for (const group of genderGroups) {
    const gender = group.gender?.trim().toLowerCase();

    const count = group._count._all;

    if (gender === "woman" || gender === "women" || gender === "female") {
      genderCounts.women += count;
    } else if (gender === "man" || gender === "men" || gender === "male") {
      genderCounts.men += count;
    } else if (!gender) {
      genderCounts.unknown += count;
    } else {
      genderCounts.other += count;
    }
  }
  // ======================================
  // 14. FORMAT GUEST RESPONSE
  // ======================================

  const items: GuestListItem[] = guests.map((guest) => {
    const ticket = guest.bookingTicket;
    const booking = ticket.booking;

    const isCancelled =
      ticket.status === EventTicketStatus.CANCELLED ||
      booking.status === EventBookingStatus.CANCELLED ||
      booking.status === EventBookingStatus.REFUNDED;

    let status: GuestAttendanceStatus;

    if (isCancelled) {
      status = "CANCELLED";
    } else if (guest.checkedInAt) {
      status = "CHECKED_IN";
    } else if (guest.isNoShow || ticket.status === EventTicketStatus.NO_SHOW) {
      status = "NO_SHOW";
    } else {
      status = "NOT_ARRIVED";
    }

    return {
      id: guest.id,
      userId: guest.userId,

      bookingId: booking.id,
      bookingNumber: booking.bookingNumber,

      bookingTicketId: ticket.id,
      ticketId: ticket.ticketId,
      ticketType: ticket.ticketType,

      fullName: guest.fullName,
      age: guest.age,
      gender: guest.gender,

      initials: getInitials(guest.fullName),

      bookedAt: booking.createdAt,
      bookedLabel: getBookedLabel(booking.createdAt),

      status,
      isFirstWelvorsEvent: guest.userId
        ? !previousAttendeeIds.has(guest.userId)
        : null,

      attendanceLabel:
        status === "CHECKED_IN"
          ? "Checked in"
          : status === "CANCELLED"
            ? "Cancelled"
            : status === "NO_SHOW"
              ? "No show"
              : "Not yet",

      isPrimaryGuest: guest.isPrimaryGuest,

      isCheckedIn: Boolean(guest.checkedInAt),

      checkedInAt: guest.checkedInAt,
      checkedOutAt: guest.checkedOutAt,

      canCheckIn:
        permissions.canCheckInGuests &&
        isCheckInOpen &&
        status === "NOT_ARRIVED" &&
        booking.paymentStatus === EventBookingPaymentStatus.PAID &&
        (booking.status === EventBookingStatus.CONFIRMED ||
          booking.status === EventBookingStatus.PARTIALLY_CANCELLED) &&
        (ticket.status === EventTicketStatus.CONFIRMED ||
          ticket.status === EventTicketStatus.CHECKED_IN),
    };
  });

  // ======================================
  // 15. CHECK-IN PROGRESS
  // ======================================

  const checkInPercentage =
    bookedCount > 0
      ? Number(((checkedInCount / bookedCount) * 100).toFixed(2))
      : 0;

  // ======================================
  // 16. FINAL RESPONSE
  // ======================================

  return {
    event: {
      id: event.id,
      eventDateId: eventDate.id,
      title: event.title,
      status: event.status,
      eventDateStatus: eventDate.status,

      eventDurationType: event.eventDurationType,
      tripType: event.tripType,

      venueName:
        event.venue?.venueName ?? event.tripDetails?.pickupPoint ?? null,

      venueAddress: event.venue?.fullAddress ?? null,

      startDateTime: eventDate.startDateTime,
      endDateTime: eventDate.endDateTime,
      gateOpensAt: eventDate.gateOpensAt,
      timezone: eventDate.timezone,

      totalGuestCapacity: eventDate.totalGuestCapacity,

      isCheckInOpen,
    },

    counts: {
      all: allCount,
      booked: bookedCount,
      checkedIn: checkedInCount,
      notArrived: notArrivedCount,
      cancelled: cancelledCount,
      noShow: noShowCount,
    },

    permissions: {
      canViewGuestList: permissions.canViewGuestList,

      canCheckInGuests: permissions.canCheckInGuests,
    },

    genderCounts: {
      women: genderCounts.women,
      men: genderCounts.men,
      other: genderCounts.other,
      unknown: genderCounts.unknown,

      label: `${genderCounts.women} · ${genderCounts.men}`,
    },

    checkInProgress: {
      checkedIn: checkedInCount,
      totalBooked: bookedCount,
      percentage: checkInPercentage,
      label: `${checkedInCount} / ${bookedCount} checked in`,
    },

    filters: {
      type,
      search: search ?? null,
    },

    items,

    pagination: {
      page,
      limit,
      total: filteredCount,
      totalPages: Math.ceil(filteredCount / limit),
      hasNextPage: page * limit < filteredCount,
      hasPreviousPage: page > 1,
    },
  };
};
