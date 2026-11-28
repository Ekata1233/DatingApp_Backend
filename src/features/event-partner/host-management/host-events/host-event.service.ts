import {
  Prisma,
  HostStatus,
  EventHostStatus,
  EventStatus,
  EventDateStatus,
  EventBookingStatus,
  EventBookingPaymentStatus,
  EventTicketStatus,
} from "@prisma/client";

import {
  GetHostEventsParams,
  HostEventPermissions,
  HostEventCounts,
  HostEventListItem,
  HostEventCard,
  HostEventGroup,
  HostEventDisplayStatus,
} from "./host-event.types";
import { prisma } from "../../../../prisma/prismaClient";


// ============================================
// CUSTOM ERROR
// ============================================

export class HostEventError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
  ) {
    super(message);
    this.name = "HostEventError";
  }
}


// ============================================
// HOST SELECT
// ============================================

const hostSelect = {
  id: true,
  partnerId: true,
  businessId: true,
  fullName: true,

  status: true,
  onboardingCompleted: true,
  removedAt: true,

  canViewGuestList: true,
  canCheckInGuests: true,
  canUpdateRunSheetProgress: true,
  canViewRoomList: true,
  canReportIncidentSOS: true,
  canMessageGuests: true,
  canReplyToReviews: true,
  canCreateSubmitEvent: true,
  canEditEvent: true,
  canCancelEventRefund: true,
  canManagePayouts: true,
} satisfies Prisma.HostSelect;


// ============================================
// EVENT SELECT
// ============================================

const hostEventSelect = {
  id: true,
  title: true,
  tagline: true,

  hostId: true,

  eventDurationType: true,
  tripType: true,
  status: true,

  totalCapacity: true,

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

  venue: {
    select: {
      venueName: true,
      fullAddress: true,
    },
  },

  tripDetails: {
    select: {
      totalDays: true,
      pickupCity: true,
      pickupPoint: true,
      destinationPlace: true,
      destinationArea: true,
    },
  },

  dates: {
    orderBy: {
      startDateTime: "asc",
    },

    select: {
      id: true,

      startDateTime: true,
      endDateTime: true,
      gateOpensAt: true,
      timezone: true,

      status: true,

      reactivationId: true,

      totalGuestCapacity: true,

      bookingOpensAt: true,
      bookingClosesAt: true,
      isBookingEnabled: true,

      ticketInventories: {
        where: {
          isActive: true,
        },

        select: {
          totalCapacity: true,
          bookedQuantity: true,
          reservedQuantity: true,
          guestsPerTicket: true,
        },
      },
    },
  },
} satisfies Prisma.EventSelect;


// ============================================
// INTERNAL TYPES
// ============================================

type SelectedHost = Prisma.HostGetPayload<{
  select: typeof hostSelect;
}>;

type SelectedHostEvent = Prisma.EventGetPayload<{
  select: typeof hostEventSelect;
}>;

type SelectedEventDate =
  SelectedHostEvent["dates"][number];

  // ============================================
// VALIDATE HOST ACCESS
// ============================================

const validateHostAccess = async (
  tx: Prisma.TransactionClient,
  partnerId: string,
  businessId: string,
): Promise<SelectedHost> => {

  const host = await tx.host.findFirst({
    where: {
      partnerId,
      businessId,
    },

    select: hostSelect,
  });

  if (!host) {
    throw new HostEventError(
      "Host profile not found",
      403,
    );
  }

  if (
    host.status !== HostStatus.ACTIVE ||
    host.removedAt !== null
  ) {
    throw new HostEventError(
      "Host account is not active",
      403,
    );
  }

  if (!host.onboardingCompleted) {
    throw new HostEventError(
      "Please complete host onboarding",
      403,
    );
  }

  return host;
};


// ============================================
// GET HOST PERMISSIONS
// ============================================

const getHostPermissions = (
  host: SelectedHost,
): HostEventPermissions => {
  return {
    canViewGuestList:
      host.canViewGuestList,

    canCheckInGuests:
      host.canCheckInGuests,

    canUpdateRunSheetProgress:
      host.canUpdateRunSheetProgress,

    canViewRoomList:
      host.canViewRoomList,

    canReportIncidentSOS:
      host.canReportIncidentSOS,

    canMessageGuests:
      host.canMessageGuests,

    canReplyToReviews:
      host.canReplyToReviews,

    canCreateSubmitEvent:
      host.canCreateSubmitEvent,

    canEditEvent:
      host.canEditEvent,

    canCancelEventRefund:
      host.canCancelEventRefund,

    canManagePayouts:
      host.canManagePayouts,
  };
};

// ============================================
// GET LOCAL DATE KEY
// ============================================

const getLocalDateKey = (
  date: Date,
  timezone = "Asia/Kolkata",
): string => {

  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).formatToParts(date);

  const getPart = (type: string) =>
    parts.find(
      (part) => part.type === type,
    )?.value;

  return [
    getPart("year"),
    getPart("month"),
    getPart("day"),
  ].join("-");
};


// ============================================
// FORMAT SHORT DATE
// ============================================

const formatShortDate = (
  date: Date,
  timezone: string,
): string => {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: timezone,
      weekday: "short",
      day: "numeric",
      month: "short",
    },
  ).format(date);
};


// ============================================
// FORMAT EVENT TIME
// ============================================

const formatEventTime = (
  date: Date,
  timezone: string,
): string => {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    },
  )
    .format(date)
    .replace(":00", "")
    .replace(/\u202f/g, " ");
};


// ============================================
// EFFECTIVE END TIME
// ============================================

const getEffectiveEndTime = (
  date: SelectedEventDate,
): Date => {
  return (
    date.endDateTime ??
    new Date(
      date.startDateTime.getTime() +
        24 * 60 * 60 * 1000,
    )
  );
};


// ============================================
// CALCULATE CALENDAR DAY DIFFERENCE
// ============================================

const getCalendarDayDifference = (
  from: Date,
  to: Date,
  timezone: string,
): number => {

  const fromKey = getLocalDateKey(
    from,
    timezone,
  );

  const toKey = getLocalDateKey(
    to,
    timezone,
  );

  return Math.round(
    (
      new Date(
        `${toKey}T00:00:00Z`,
      ).getTime() -
      new Date(
        `${fromKey}T00:00:00Z`,
      ).getTime()
    ) / 86400000,
  );
};


// ============================================
// FORMAT RELATIVE DATE
// ============================================

const getRelativeDateLabel = (
  days: number,
  isOngoing: boolean,
): string => {

  if (isOngoing) {
    return "Ongoing";
  }

  if (days === 0) {
    return "Today";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  if (days === -1) {
    return "Yesterday";
  }

  if (days > 1) {
    return `in ${days} days`;
  }

  return `${Math.abs(days)} days ago`;
};

// ============================================
// GET TRIP DURATION
// ============================================

const getTripDuration = (
  event: SelectedHostEvent,
  date: SelectedEventDate,
) => {

  if (
    event.eventDurationType !== "MULTI_DAY"
  ) {
    return {
      totalDays: null,
      totalNights: null,
      durationLabel: null,
    };
  }

  let totalDays =
    event.tripDetails?.totalDays ?? null;

  if (date.endDateTime) {
    totalDays = Math.max(
      1,
      getCalendarDayDifference(
        date.startDateTime,
        date.endDateTime,
        date.timezone,
      ) + 1,
    );
  }

  if (totalDays === null) {
    return {
      totalDays: null,
      totalNights: null,
      durationLabel: null,
    };
  }

  const totalNights = Math.max(
    0,
    totalDays - 1,
  );

  return {
    totalDays,
    totalNights,
    durationLabel:
      `${totalDays}D·${totalNights}N`,
  };
};


// ============================================
// GET EVENT DATE LABEL
// ============================================

const getEventDateLabel = (
  date: SelectedEventDate,
  durationLabel: string | null,
): string => {

  const {
    startDateTime,
    endDateTime,
    timezone,
  } = date;

  const startDate = formatShortDate(
    startDateTime,
    timezone,
  );

  const startTime = formatEventTime(
    startDateTime,
    timezone,
  );

  if (!endDateTime) {
    return `${startDate} · ${startTime}`;
  }

  const isSameDay =
    getLocalDateKey(
      startDateTime,
      timezone,
    ) ===
    getLocalDateKey(
      endDateTime,
      timezone,
    );

  if (isSameDay) {
    const endTime = formatEventTime(
      endDateTime,
      timezone,
    );

    return (
      `${startDate} · ` +
      `${startTime} – ${endTime}`
    );
  }

  const endDate = formatShortDate(
    endDateTime,
    timezone,
  );

  return durationLabel
    ? `${startDate} – ${endDate} · ${durationLabel}`
    : `${startDate} – ${endDate}`;
};


// ============================================
// GET EVENT LOCATION
// ============================================

const getLocationLabel = (
  event: SelectedHostEvent,
): string | null => {

  if (
    event.eventDurationType === "MULTI_DAY"
  ) {
    const trip = event.tripDetails;

    const pickup = [
      trip?.pickupPoint,
      trip?.pickupCity,
    ]
      .filter(Boolean)
      .join(", ");

    const destination = [
      trip?.destinationPlace,
      trip?.destinationArea,
    ]
      .filter(Boolean)
      .join(" · ");

    if (pickup && destination) {
      return `${pickup} → ${destination}`;
    }

    return (
      pickup ||
      destination ||
      event.venue?.fullAddress ||
      null
    );
  }

  return (
    // event.venue?.venueName ??
    event.venue?.fullAddress ??
    null
  );
};

// ============================================
// GET DATE-WISE BOOKED GUEST COUNTS
// ============================================

const getBookedGuestCounts = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  eventDateIds: string[],
): Promise<Map<string, number>> => {

  const guestCountMap = new Map<
    string,
    number
  >();

  if (eventDateIds.length === 0) {
    return guestCountMap;
  }

  const bookings =
    await tx.eventBooking.findMany({
      where: {
        eventDateId: {
          in: eventDateIds,
        },

        event: {
          businessDetailsId: businessId,
        },

        paymentStatus:
          EventBookingPaymentStatus.PAID,

        status: {
          in: [
            EventBookingStatus.CONFIRMED,
            EventBookingStatus.PARTIALLY_CANCELLED,
            EventBookingStatus.COMPLETED,
            EventBookingStatus.ATTENDED,
          ],
        },
      },

      select: {
        eventDateId: true,

        tickets: {
          where: {
            status: {
              in: [
                EventTicketStatus.CONFIRMED,
                EventTicketStatus.CHECKED_IN,
                EventTicketStatus.CHECKED_OUT,
                EventTicketStatus.ATTENDED,
                EventTicketStatus.NO_SHOW,
              ],
            },
          },

          select: {
            guestCount: true,
          },
        },
      },
    });

  for (const booking of bookings) {

    const bookedGuests =
      booking.tickets.reduce(
        (total, ticket) =>
          total + ticket.guestCount,
        0,
      );

    const existingCount =
      guestCountMap.get(
        booking.eventDateId,
      ) ?? 0;

    guestCountMap.set(
      booking.eventDateId,
      existingCount + bookedGuests,
    );
  }

  return guestCountMap;
};

// ============================================
// GET BOOKING AVAILABILITY
// ============================================

const getBookingAvailability = (
  event: SelectedHostEvent,
  date: SelectedEventDate,
  bookedGuests: number,
  now: Date,
) => {

  const inventoryCapacity =
    date.ticketInventories.length > 0
      ? date.ticketInventories.reduce(
          (total, inventory) =>
            total +
            inventory.totalCapacity *
              inventory.guestsPerTicket,
          0,
        )
      : null;

  const totalCapacity =
    date.totalGuestCapacity ??
    inventoryCapacity ??
    event.totalCapacity ??
    null;

  const isSoldOut =
    (
      totalCapacity !== null &&
      bookedGuests >= totalCapacity
    ) ||
    (
      date.ticketInventories.length > 0 &&
      date.ticketInventories.every(
        (inventory) =>
          inventory.bookedQuantity >=
          inventory.totalCapacity,
      )
    );

  const inventoryAvailable =
    date.ticketInventories.length > 0
      ? date.ticketInventories.some(
          (inventory) =>
            inventory.totalCapacity >
            inventory.bookedQuantity +
              inventory.reservedQuantity,
        )
      : totalCapacity !== null &&
        bookedGuests < totalCapacity;

  const bookingClosesAt =
    date.bookingClosesAt ??
    date.startDateTime;

  const isBookingWindowOpen =
    date.isBookingEnabled &&
    (
      !date.bookingOpensAt ||
      now >= date.bookingOpensAt
    ) &&
    now < bookingClosesAt;

  const isOnSale =
    event.status === EventStatus.PUBLISHED &&
    date.status === EventDateStatus.SCHEDULED &&
    now < getEffectiveEndTime(date) &&
    isBookingWindowOpen &&
    inventoryAvailable &&
    !isSoldOut;

  return {
    isOnSale,
    isSoldOut,
    isBookingWindowOpen,
  };
};

// ============================================
// GET EVENT GROUP
// ============================================

const getEventGroup = (
  event: SelectedHostEvent,
  date: SelectedEventDate,
  now: Date,
): HostEventGroup => {

  if (
    date.status === EventDateStatus.CANCELLED ||
    date.status === EventDateStatus.COMPLETED ||
    date.status === EventDateStatus.EXPIRED ||
    event.status === EventStatus.CANCELLED ||
    event.status === EventStatus.COMPLETED ||
    event.status === EventStatus.EXPIRED
  ) {
    return "past";
  }

  if (now >= getEffectiveEndTime(date)) {
    return "past";
  }

  const isToday =
    getLocalDateKey(
      date.startDateTime,
      date.timezone,
    ) ===
    getLocalDateKey(
      now,
      date.timezone,
    );

  const isOngoing =
    now >= date.startDateTime &&
    now < getEffectiveEndTime(date);

  if (isToday || isOngoing) {
    return "ongoing";
  }

  return "upcoming";
};


// ============================================
// GET EVENT DISPLAY STATUS
// ============================================

const getDisplayStatus = (
  event: SelectedHostEvent,
  date: SelectedEventDate,
  now: Date,
  availability: ReturnType<
    typeof getBookingAvailability
  >,
): HostEventDisplayStatus => {

  if (
    date.status === EventDateStatus.CANCELLED ||
    event.status === EventStatus.CANCELLED
  ) {
    return "CANCELLED";
  }

  if (
    date.status === EventDateStatus.COMPLETED ||
    event.status === EventStatus.COMPLETED
  ) {
    return "COMPLETED";
  }

  if (
    date.status === EventDateStatus.EXPIRED ||
    event.status === EventStatus.EXPIRED ||
    now >= getEffectiveEndTime(date)
  ) {
    return "EXPIRED";
  }

  if (
    event.status === EventStatus.PAUSED
  ) {
    return "PAUSED";
  }

  const isToday =
    getLocalDateKey(
      date.startDateTime,
      date.timezone,
    ) ===
    getLocalDateKey(
      now,
      date.timezone,
    );

  if (isToday) {
    return "TODAY";
  }

  if (
    now >= date.startDateTime &&
    now < getEffectiveEndTime(date)
  ) {
    return "ONGOING";
  }

  if (availability.isSoldOut) {
    return "SOLD_OUT";
  }

  if (availability.isOnSale) {
    return "ON_SALE";
  }

  if (
    !date.isBookingEnabled ||
    now >= (
      date.bookingClosesAt ??
      date.startDateTime
    )
  ) {
    return "BOOKING_CLOSED";
  }

  return "UPCOMING";
};


// ============================================
// STATUS LABELS
// ============================================

const statusLabels: Record<
  HostEventDisplayStatus,
  string
> = {
  TODAY: "Today",
  ONGOING: "Ongoing",
  ON_SALE: "On sale",
  UPCOMING: "Upcoming",
  SOLD_OUT: "Sold out",
  BOOKING_CLOSED: "Booking closed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  PAUSED: "Paused",
};

// ============================================
// BUILD HOST EVENT CARD
// ============================================

const buildHostEventCard = (
  event: SelectedHostEvent,
  date: SelectedEventDate,
  hostId: string,
  bookedGuests: number,
  now: Date,
): HostEventCard => {

  const group = getEventGroup(
    event,
    date,
    now,
  );

  const availability =
    getBookingAvailability(
      event,
      date,
      bookedGuests,
      now,
    );

  const displayStatus =
    getDisplayStatus(
      event,
      date,
      now,
      availability,
    );

  const duration = getTripDuration(
    event,
    date,
  );

  const isToday =
    getLocalDateKey(
      date.startDateTime,
      date.timezone,
    ) ===
    getLocalDateKey(
      now,
      date.timezone,
    );

  const isOngoing =
    group === "ongoing" &&
    event.status === EventStatus.PUBLISHED &&
    date.status === EventDateStatus.SCHEDULED &&
    now >= date.startDateTime &&
    now < getEffectiveEndTime(date);

  const daysUntilEvent =
    getCalendarDayDifference(
      now,
      date.startDateTime,
      date.timezone,
    );

  const isPrimaryHost =
    event.hostId === hostId;

  const item: HostEventListItem = {
    id: event.id,

    cardId: `date_${date.id}`,

    eventDateId: date.id,

    reactivationId:
      date.reactivationId ?? null,

    title: event.title,
    tagline: event.tagline,

    photoUrl:
      event.photos[0]?.photoUrl ?? null,

    eventDurationType:
      event.eventDurationType,

    tripType:
      event.tripType,

    status:
      event.status,

    eventDateStatus:
      date.status,

    displayStatus,

    statusLabel:
      statusLabels[displayStatus],

    assignmentLabel:
      isPrimaryHost
        ? "You host"
        : "Co-host",

    isPrimaryHost,

    startDateTime:
      date.startDateTime,

    endDateTime:
      date.endDateTime,

    gateOpensAt:
      date.gateOpensAt,

    timezone:
      date.timezone,

    dateLabel:
      getEventDateLabel(
        date,
        duration.durationLabel,
      ),

    totalDays:
      duration.totalDays,

    totalNights:
      duration.totalNights,

    durationLabel:
      duration.durationLabel,

    venueName:
      event.venue?.venueName ?? null,

    locationLabel:
      getLocationLabel(event),

    bookedGuests,

    guestLabel:
      `${bookedGuests} ${
        bookedGuests === 1
          ? "guest"
          : "guests"
      }`,

    daysUntilEvent,

    relativeDateLabel:
      isToday
        ? "Today"
        : getRelativeDateLabel(
            daysUntilEvent,
            isOngoing,
          ),

    isToday,

    isOngoing,

    isOnSale:
      availability.isOnSale,

    isReactivated:
      Boolean(date.reactivationId),
  };

  return {
    group,
    item,
  };
};

// ============================================
// GET ALL HOST ASSIGNED EVENTS
// ============================================

export const getAllHostEventsService = async (
  params: GetHostEventsParams,
) => {

  const {
    partnerId,
    businessId,
    type,
    search,
    eventDurationType,
    page,
    limit,
  } = params;

  const now = new Date();

  const skip = (page - 1) * limit;


  // ==========================================
  // 1. FETCH HOST AND ASSIGNED EVENTS
  // ==========================================

  const {
    host,
    events,
    guestCountMap,
  } = await prisma.$transaction(
    async (tx) => {

      // --------------------------------------
      // VALIDATE HOST
      // --------------------------------------

      const host = await validateHostAccess(
        tx,
        partnerId,
        businessId,
      );


      // --------------------------------------
      // FETCH HOST ASSIGNMENTS
      // --------------------------------------

      const assignments =
        await tx.eventHost.findMany({
          where: {
            hostId: host.id,

            event: {
              businessDetailsId: businessId,
            },
          },

          select: {
            eventId: true,
            status: true,
            removedAt: true,
            completedAt: true,
            replacedByHostId: true,
          },
        });


      // --------------------------------------
      // ACTIVE ASSIGNMENTS
      // --------------------------------------

      const activeEventIds = assignments
        .filter(
          (assignment) =>
            assignment.status ===
              EventHostStatus.ACTIVE &&
            assignment.removedAt === null &&
            assignment.completedAt === null &&
            assignment.replacedByHostId === null,
        )
        .map(
          (assignment) =>
            assignment.eventId,
        );


      // --------------------------------------
      // INACTIVE ASSIGNMENTS
      // --------------------------------------

      const inactiveEventIds = assignments
        .filter(
          (assignment) =>
            assignment.status !==
              EventHostStatus.ACTIVE ||
            assignment.removedAt !== null ||
            assignment.completedAt !== null ||
            assignment.replacedByHostId !== null,
        )
        .map(
          (assignment) =>
            assignment.eventId,
        );


      // --------------------------------------
      // EVENT ACCESS FILTER
      // --------------------------------------

      const where: Prisma.EventWhereInput = {
        businessDetailsId: businessId,

        isDeleted: false,
        deletedAt: null,

        status: {
          in: [
            EventStatus.PUBLISHED,
            EventStatus.PAUSED,
            EventStatus.COMPLETED,
            EventStatus.CANCELLED,
            EventStatus.EXPIRED,
          ],
        },

        AND: [
          {
            OR: [
              // Primary host
              {
                hostId: host.id,
              },

              // Assigned co-host
              {
                id: {
                  in: activeEventIds,
                },
              },
            ],
          },

          // Prevent access through stale hostId
          {
            id: {
              notIn: inactiveEventIds,
            },
          },
        ],
      };


      // --------------------------------------
      // EVENT DURATION FILTER
      // --------------------------------------

      if (eventDurationType) {
        where.eventDurationType =
          eventDurationType;
      }


      // --------------------------------------
      // SEARCH FILTER
      // --------------------------------------

      if (search) {
        where.OR = [
          {
            title: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            tagline: {
              contains: search,
              mode: "insensitive",
            },
          },

          {
            about: {
              contains: search,
              mode: "insensitive",
            },
          },
        ];
      }


      // --------------------------------------
      // FETCH ASSIGNED EVENTS
      // --------------------------------------

      const events =
        await tx.event.findMany({
          where,

          select: hostEventSelect,

          orderBy: [
            {
              createdAt: "desc",
            },
            {
              id: "asc",
            },
          ],
        });


      // --------------------------------------
      // GET ALL EVENT DATE IDS
      // --------------------------------------

      const eventDateIds =
        events.flatMap(
          (event) =>
            event.dates.map(
              (date) => date.id,
            ),
        );


      // --------------------------------------
      // FETCH GUEST COUNTS
      // --------------------------------------

      const guestCountMap =
        await getBookedGuestCounts(
          tx,
          businessId,
          eventDateIds,
        );

      return {
        host,
        events,
        guestCountMap,
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel
          .RepeatableRead,

      timeout: 15000,
    },
  );


  // ==========================================
  // 2. BUILD EVENT CARDS
  // ==========================================

  const cards: HostEventCard[] = [];

  for (const event of events) {

    for (const date of event.dates) {

      const bookedGuests =
        guestCountMap.get(date.id) ?? 0;

      const card = buildHostEventCard(
        event,
        date,
        host.id,
        bookedGuests,
        now,
      );

      cards.push(card);
    }
  }


  // ==========================================
  // 3. GET EVENT COUNTS
  // ==========================================

  const counts: HostEventCounts = {
    ongoing: 0,
    upcoming: 0,
    past: 0,
    total: 0,
  };

  for (const card of cards) {

    if (card.group === "ongoing") {
      counts.ongoing++;
    }

    if (card.group === "upcoming") {
      counts.upcoming++;
    }

    if (card.group === "past") {
      counts.past++;
    }
  }

  counts.total =
   counts.ongoing +
  counts.upcoming +
  counts.past;


// ==========================================
// 4. APPLY TYPE FILTER
// ==========================================

const filteredCards = cards.filter(
  (card) => {

    if (type === "all") {
      return true;
    }

    return card.group === type;
  },
);

  // ==========================================
  // 5. SORT EVENT CARDS
  // ==========================================

  const groupPriority: Record<
    HostEventGroup,
    number
  > = {
    ongoing: 1,
    upcoming: 2,
    past: 3,
  };

  filteredCards.sort((a, b) => {

    const priorityDifference =
      groupPriority[a.group] -
      groupPriority[b.group];

    if (priorityDifference !== 0) {
      return priorityDifference;
    }

    // Running events before today's
    // events that have not started.

    if (a.group === "ongoing") {

      const ongoingDifference =
        Number(b.item.isOngoing) -
        Number(a.item.isOngoing);

      if (ongoingDifference !== 0) {
        return ongoingDifference;
      }
    }

    const aTime =
      a.item.startDateTime.getTime();

    const bTime =
      b.item.startDateTime.getTime();

    const timeDifference =
      a.group === "past"
        ? bTime - aTime
        : aTime - bTime;

    return (
      timeDifference ||
      a.item.cardId.localeCompare(
        b.item.cardId,
      )
    );
  });


  // ==========================================
  // 6. PAGINATION
  // ==========================================

  const total = filteredCards.length;

  const totalPages = Math.ceil(
    total / limit,
  );

  const paginatedCards =
    filteredCards.slice(
      skip,
      skip + limit,
    );


  // ==========================================
  // 7. GROUP RESPONSE
  // ==========================================

  const ongoing = paginatedCards
    .filter(
      (card) =>
        card.group === "ongoing",
    )
    .map(
      (card) => card.item,
    );

  const upcoming = paginatedCards
    .filter(
      (card) =>
        card.group === "upcoming",
    )
    .map(
      (card) => card.item,
    );

  const past = paginatedCards
    .filter(
      (card) =>
        card.group === "past",
    )
    .map(
      (card) => card.item,
    );


  // ==========================================
  // 8. FINAL RESPONSE
  // ==========================================

  return {
    host: {
      id: host.id,
      fullName: host.fullName,
      businessId: host.businessId,
    },

    counts,

    summary: {
      label:
        `${counts.ongoing} ongoing · ` +
        `${counts.upcoming} next`,
    },

    filters: {
      type,

      search:
        search ?? null,

      eventDurationType:
        eventDurationType ?? null,
    },

    ongoing,
    upcoming,
    past,

    permissions:
      getHostPermissions(host),

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage:
        page * limit < total,

      hasPreviousPage:
        page > 1,
    },

    accessNotice:
      "You only see events assigned to you. " +
      "Money and settings stay with the owner.",
  };
};