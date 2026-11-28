// import {
//   Prisma,
//   EventStatus,
//   EventDateStatus,
//   EventReactiveStatus,
//   EventBookingStatus,
//   EventBookingPaymentStatus,
//   EventTicketStatus,
// } from "@prisma/client";
// import { GetAllOrganizerEventsParams, OrganizerEventCardType, OrganizerEventCounts, OrganizerEventDisplayStatus, OrganizerEventListItem, OrganizerEventListType } from "./myEvent.types";
// import { prisma } from "../../../../prisma/prismaClient";



// // ============================================
// // EVENT LIST SELECT
// // ============================================

// const organizerEventSelect = {
//   id: true,
//   title: true,
//   tagline: true,

//   categoryId: true,

//   eventDurationType: true,
//   tripType: true,

//   status: true,
//   eventReactiveStatus: true,

//   totalCapacity: true,
//   menCapacity: true,
//   womenCapacity: true,
//   otherCapacity: true,
//   coupleCapacity: true,
//   priceType: true,

//   currentStep: true,
//   completedSteps: true,

//   createdAt: true,
//   updatedAt: true,

//   photos: {
//     where: {
//       photoType: "EVENT",
//     },
//     orderBy: {
//       sortOrder: "asc",
//     },
//     take: 1,
//     select: {
//       photoUrl: true,
//     },
//   },

//   venue: {
//     select: {
//       venueName: true,
//       fullAddress: true,
//     },
//   },

//   tripDetails: {
//     select: {
//       totalDays: true,
//       pickupCity: true,
//       pickupPoint: true,
//       destinationPlace: true,
//       destinationArea: true,
//     },
//   },

//   dates: {
//     orderBy: {
//       startDateTime: "asc",
//     },

//     select: {
//       id: true,
//       startDateTime: true,
//       endDateTime: true,
//       gateOpensAt: true,
//       timezone: true,

//       status: true,

//       totalGuestCapacity: true,
//       bookingOpensAt: true,
//       bookingClosesAt: true,
//       isBookingEnabled: true,

//       isPrimary: true,
//       isMoreDate: true,

//       reactivationId: true,

//       ticketInventories: {
//         where: {
//           isActive: true,
//         },

//         select: {
//           totalCapacity: true,
//           reservedQuantity: true,
//           bookedQuantity: true,
//           guestsPerTicket: true,
//         },
//       },
//     },
//   },

//   reactivations: {
//     where: {
//       status: {
//         in: [
//           EventReactiveStatus.DRAFT,
//           EventReactiveStatus.SUBMITTED,
//           EventReactiveStatus.UNDER_REVIEW,
//           EventReactiveStatus.APPROVED,
//           EventReactiveStatus.REJECTED,
//         ],
//       },
//     },

//     orderBy: {
//       createdAt: "desc",
//     },

//     select: {
//       id: true,
//       status: true,
//       createdAt: true,
//       updatedAt: true,

//       dates: {
//         orderBy: {
//           startDateTime: "asc",
//         },

//         select: {
//           startDateTime: true,
//           endDateTime: true,
//           gateOpensAt: true,
//           timezone: true,
//         },
//       },
//     },
//   },
// } satisfies Prisma.EventSelect;


// // ============================================
// // INTERNAL TYPES
// // ============================================

// type SelectedEvent = Prisma.EventGetPayload<{
//   select: typeof organizerEventSelect;
// }>;

// type SelectedEventDate =
//   SelectedEvent["dates"][number];

// type SelectedReactivation =
//   SelectedEvent["reactivations"][number];

// type EventCardGroup =
//   | "upcoming"
//   | "in_review"
//   | "drafts"
//   | "past"
//   | "rejected"
//   | "paused"
//   | "approved";

// interface EventDateStats {
//   bookedGuests: number;
//   grossTicketSales: Prisma.Decimal;
// }

// interface InternalEventCard {
//   group: EventCardGroup;
//   item: OrganizerEventListItem;
// }

// // ============================================
// // GET LOCAL DATE KEY
// // ============================================

// const getLocalDateKey = (
//   date: Date,
//   timezone = "Asia/Kolkata",
// ): string => {
//   const parts = new Intl.DateTimeFormat("en-CA", {
//     timeZone: timezone,
//     year: "numeric",
//     month: "2-digit",
//     day: "2-digit",
//   }).formatToParts(date);

//   const getPart = (type: string) =>
//     parts.find((part) => part.type === type)?.value;

//   return [
//     getPart("year"),
//     getPart("month"),
//     getPart("day"),
//   ].join("-");
// };


// // ============================================
// // FORMAT SHORT DATE
// // ============================================

// const formatShortDate = (
//   date: Date,
//   timezone: string,
// ): string => {
//   return new Intl.DateTimeFormat("en-GB", {
//     timeZone: timezone,
//     weekday: "short",
//     day: "numeric",
//     month: "short",
//   }).format(date);
// };


// // ============================================
// // FORMAT EVENT TIME
// // ============================================

// const formatEventTime = (
//   date: Date,
//   timezone: string,
// ): string => {
//   return new Intl.DateTimeFormat("en-US", {
//     timeZone: timezone,
//     hour: "numeric",
//     minute: "2-digit",
//     hour12: true,
//   })
//     .format(date)
//     .replace(":00", "")
//     .replace(/\u202f/g, " ");
// };


// // ============================================
// // FORMAT EVENT DATE LABEL
// // ============================================

// const getEventDateLabel = (
//   startDateTime: Date | null,
//   endDateTime: Date | null,
//   timezone: string,
//   durationLabel: string | null,
// ): string | null => {
//   if (!startDateTime) {
//     return null;
//   }

//   const startDate = formatShortDate(
//     startDateTime,
//     timezone,
//   );

//   if (!endDateTime) {
//     return `${startDate} · ${formatEventTime(
//       startDateTime,
//       timezone,
//     )}`;
//   }

//   const isSameDay =
//     getLocalDateKey(startDateTime, timezone) ===
//     getLocalDateKey(endDateTime, timezone);

//   if (isSameDay) {
//     return `${startDate} · ${formatEventTime(
//       startDateTime,
//       timezone,
//     )} – ${formatEventTime(
//       endDateTime,
//       timezone,
//     )}`;
//   }

//   const endDate = formatShortDate(
//     endDateTime,
//     timezone,
//   );

//   return durationLabel
//     ? `${startDate} – ${endDate} · ${durationLabel}`
//     : `${startDate} – ${endDate}`;
// };


// // ============================================
// // GET EFFECTIVE EVENT END TIME
// // ============================================

// const getEffectiveEndTime = (
//   date: SelectedEventDate,
// ): Date => {
//   if (date.endDateTime) {
//     return date.endDateTime;
//   }

//   // Fallback when endDateTime is not available.
//   // This avoids keeping an event ongoing forever.
//   return new Date(
//     date.startDateTime.getTime() + 24 * 60 * 60 * 1000,
//   );
// };

// // ============================================
// // GET EVENT CAPACITY
// // ============================================

// const getEventCapacity = (
//   event: SelectedEvent,
//   date?: SelectedEventDate,
// ): number | null => {
//   // Priority 1: Date-specific guest capacity

//   if (date?.totalGuestCapacity != null) {
//     return date.totalGuestCapacity;
//   }

//   // Priority 2: Date-specific ticket inventory

//   if (date && date.ticketInventories.length > 0) {
//     return date.ticketInventories.reduce(
//       (total, inventory) =>
//         total +
//         inventory.totalCapacity *
//           inventory.guestsPerTicket,
//       0,
//     );
//   }

//   // Priority 3: Event-level total guest capacity

//   if (event.totalCapacity != null) {
//     return event.totalCapacity;
//   }

//   // Priority 4: Couples capacity

//   if (event.priceType === "PER_COUPLE") {
//     return event.coupleCapacity != null
//       ? event.coupleCapacity * 2
//       : null;
//   }

//   // Priority 5: Individual capacity

//   const capacities = [
//     event.menCapacity,
//     event.womenCapacity,
//     event.otherCapacity,
//   ];

//   if (capacities.every((value) => value == null)) {
//     return null;
//   }

//   return capacities.reduce<number>(
//     (total, value) => total + (value ?? 0),
//     0,
//   );
// };


// // ============================================
// // GET TRIP DURATION
// // ============================================

// const getTripDuration = (
//   event: SelectedEvent,
//   startDateTime: Date | null,
//   endDateTime: Date | null,
//   timezone: string,
// ) => {
//   if (event.eventDurationType !== "MULTI_DAY") {
//     return {
//       totalDays: null,
//       totalNights: null,
//       durationLabel: null,
//     };
//   }

//   let totalDays =
//     event.tripDetails?.totalDays ?? null;

//   if (startDateTime && endDateTime) {
//     const startKey = getLocalDateKey(
//       startDateTime,
//       timezone,
//     );

//     const endKey = getLocalDateKey(
//       endDateTime,
//       timezone,
//     );

//     const difference = Math.floor(
//       (
//         new Date(`${endKey}T00:00:00Z`).getTime() -
//         new Date(`${startKey}T00:00:00Z`).getTime()
//       ) / 86400000,
//     );

//     totalDays = Math.max(1, difference + 1);
//   }

//   if (totalDays == null) {
//     return {
//       totalDays: null,
//       totalNights: null,
//       durationLabel: null,
//     };
//   }

//   const totalNights = Math.max(0, totalDays - 1);

//   return {
//     totalDays,
//     totalNights,
//     durationLabel: `${totalDays}D·${totalNights}N`,
//   };
// };


// // ============================================
// // GET EVENT LOCATION
// // ============================================

// const getLocationLabel = (
//   event: SelectedEvent,
// ): string | null => {
//   if (event.eventDurationType === "MULTI_DAY") {
//     const trip = event.tripDetails;

//     const pickup = [
//       trip?.pickupPoint,
//       trip?.pickupCity,
//     ]
//       .filter(Boolean)
//       .join(", ");

//     const destination = [
//       trip?.destinationPlace,
//       trip?.destinationArea,
//     ]
//       .filter(Boolean)
//       .join(" · ");

//     if (pickup && destination) {
//       return `${pickup} → ${destination}`;
//     }

//     return pickup || destination || null;
//   }

//   return (
//     event.venue?.venueName ??
//     event.venue?.fullAddress ??
//     null
//   );
// };

// // ============================================
// // FETCH DATE-WISE BOOKING STATISTICS
// // ============================================

// const getEventDateStats = async (
//   tx: Prisma.TransactionClient,
//   businessId: string,
//   eventDateIds: string[],
// ): Promise<Map<string, EventDateStats>> => {
//   const statsMap = new Map<
//     string,
//     EventDateStats
//   >();

//   if (eventDateIds.length === 0) {
//     return statsMap;
//   }

//   const bookings = await tx.eventBooking.findMany({
//     where: {
//       eventDateId: {
//         in: eventDateIds,
//       },

//       event: {
//         businessDetailsId: businessId,
//       },

//       paymentStatus:
//         EventBookingPaymentStatus.PAID,

//       status: {
//         in: [
//           EventBookingStatus.CONFIRMED,
//           EventBookingStatus.PARTIALLY_CANCELLED,
//           EventBookingStatus.COMPLETED,
//           EventBookingStatus.ATTENDED,
//         ],
//       },
//     },

//     select: {
//       eventDateId: true,

//       tickets: {
//         where: {
//           status: {
//             in: [
//               EventTicketStatus.CONFIRMED,
//               EventTicketStatus.CHECKED_IN,
//               EventTicketStatus.CHECKED_OUT,
//               EventTicketStatus.ATTENDED,
//               EventTicketStatus.NO_SHOW,
//             ],
//           },
//         },

//         select: {
//           guestCount: true,
//           ticketAmount: true,
//         },
//       },
//     },
//   });

//   for (const booking of bookings) {
//     const current = statsMap.get(
//       booking.eventDateId,
//     ) ?? {
//       bookedGuests: 0,
//       grossTicketSales: new Prisma.Decimal(0),
//     };

//     for (const ticket of booking.tickets) {
//       current.bookedGuests += ticket.guestCount;

//       current.grossTicketSales =
//         current.grossTicketSales.plus(
//           ticket.ticketAmount,
//         );
//     }

//     statsMap.set(
//       booking.eventDateId,
//       current,
//     );
//   }

//   return statsMap;
// };

// // ============================================
// // CHECK IF EVENT IS ON SALE
// // ============================================

// const getBookingAvailability = (
//   event: SelectedEvent,
//   date: SelectedEventDate,
//   bookedGuests: number,
//   totalCapacity: number | null,
//   now: Date,
// ) => {
//   const inventoryAvailable =
//     date.ticketInventories.length > 0
//       ? date.ticketInventories.some(
//           (inventory) =>
//             inventory.totalCapacity >
//             inventory.bookedQuantity +
//               inventory.reservedQuantity,
//         )
//       : totalCapacity != null &&
//         bookedGuests < totalCapacity;

//   const isSoldOut =
//     (
//       totalCapacity != null &&
//       bookedGuests >= totalCapacity
//     ) ||
//     (
//       date.ticketInventories.length > 0 &&
//       date.ticketInventories.every(
//         (inventory) =>
//           inventory.bookedQuantity >=
//           inventory.totalCapacity,
//       )
//     );

//   const bookingOpensAt =
//     date.bookingOpensAt;

//   const bookingClosesAt =
//     date.bookingClosesAt ??
//     date.startDateTime;

//   const isBookingWindowOpen =
//     date.isBookingEnabled &&
//     (!bookingOpensAt || now >= bookingOpensAt) &&
//     now < bookingClosesAt;

//   const isOnSale =
//     event.status === EventStatus.PUBLISHED &&
//     date.status === EventDateStatus.SCHEDULED &&
//     now < getEffectiveEndTime(date) &&
//     isBookingWindowOpen &&
//     inventoryAvailable &&
//     !isSoldOut;

//   return {
//     isOnSale,
//     isSoldOut,
//     isBookingWindowOpen,
//   };
// };

// // ============================================
// // DISPLAY STATUS LABELS
// // ============================================

// const statusLabels: Record<
//   OrganizerEventDisplayStatus,
//   string
// > = {
//   TODAY: "Today",
//   ONGOING: "Ongoing",
//   ON_SALE: "On sale",
//   SOLD_OUT: "Sold out",
//   BOOKING_CLOSED: "Booking closed",
//   UPCOMING: "Upcoming",
//   DRAFT: "Draft",
//   IN_REVIEW: "In review",
//   APPROVED: "Approved",
//   REJECTED: "Rejected",
//   PAUSED: "Paused",
//   COMPLETED: "Completed",
//   CANCELLED: "Cancelled",
//   EXPIRED: "Expired",
// };


// // ============================================
// // CLASSIFY EVENT WORKFLOW STATUS
// // ============================================

// const getWorkflowStatus = (
//   status: EventStatus | EventReactiveStatus,
// ): {
//   group: EventCardGroup;
//   displayStatus: OrganizerEventDisplayStatus;
// } => {
//   switch (status) {
//     case "DRAFT":
//       return {
//         group: "drafts",
//         displayStatus: "DRAFT",
//       };

//     case "SUBMITTED":
//     case "UNDER_REVIEW":
//       return {
//         group: "in_review",
//         displayStatus: "IN_REVIEW",
//       };

//     case "APPROVED":
//       return {
//         group: "approved",
//         displayStatus: "APPROVED",
//       };

//     case "REJECTED":
//       return {
//         group: "rejected",
//         displayStatus: "REJECTED",
//       };

//     case "PAUSED":
//       return {
//         group: "paused",
//         displayStatus: "PAUSED",
//       };

//     case "CANCELLED":
//       return {
//         group: "past",
//         displayStatus: "CANCELLED",
//       };

//     case "COMPLETED":
//       return {
//         group: "past",
//         displayStatus: "COMPLETED",
//       };

//     case "EXPIRED":
//       return {
//         group: "past",
//         displayStatus: "EXPIRED",
//       };

//     default:
//       return {
//         group: "upcoming",
//         displayStatus: "UPCOMING",
//       };
//   }
// };


// // ============================================
// // CLASSIFY PUBLISHED EVENT DATE
// // ============================================

// const getDateDisplayStatus = (
//   event: SelectedEvent,
//   date: SelectedEventDate,
//   now: Date,
//   availability: ReturnType<
//     typeof getBookingAvailability
//   >,
// ): {
//   group: EventCardGroup;
//   displayStatus: OrganizerEventDisplayStatus;
// } => {
//   if (
//     date.status === EventDateStatus.CANCELLED ||
//     event.status === EventStatus.CANCELLED
//   ) {
//     return {
//       group: "past",
//       displayStatus: "CANCELLED",
//     };
//   }

//   if (date.status === EventDateStatus.COMPLETED) {
//     return {
//       group: "past",
//       displayStatus: "COMPLETED",
//     };
//   }

//   if (date.status === EventDateStatus.EXPIRED) {
//     return {
//       group: "past",
//       displayStatus: "EXPIRED",
//     };
//   }

//   if (
//     event.status === EventStatus.COMPLETED ||
//     event.status === EventStatus.EXPIRED
//   ) {
//     return getWorkflowStatus(event.status);
//   }

//   if (now >= getEffectiveEndTime(date)) {
//     return {
//       group: "past",
//       displayStatus: "EXPIRED",
//     };
//   }

//   if (event.status === EventStatus.PAUSED) {
//     return {
//       group: "paused",
//       displayStatus: "PAUSED",
//     };
//   }

//   const isToday =
//     getLocalDateKey(
//       date.startDateTime,
//       date.timezone,
//     ) ===
//     getLocalDateKey(now, date.timezone);

//   const isOngoing =
//     now >= date.startDateTime &&
//     now < getEffectiveEndTime(date);

//   if (isToday) {
//     return {
//       group: "upcoming",
//       displayStatus: "TODAY",
//     };
//   }

//   if (isOngoing) {
//     return {
//       group: "upcoming",
//       displayStatus: "ONGOING",
//     };
//   }

//   if (availability.isSoldOut) {
//     return {
//       group: "upcoming",
//       displayStatus: "SOLD_OUT",
//     };
//   }

//   if (availability.isOnSale) {
//     return {
//       group: "upcoming",
//       displayStatus: "ON_SALE",
//     };
//   }

//   if (
//     !date.isBookingEnabled ||
//     now >= (
//       date.bookingClosesAt ??
//       date.startDateTime
//     )
//   ) {
//     return {
//       group: "upcoming",
//       displayStatus: "BOOKING_CLOSED",
//     };
//   }

//   return {
//     group: "upcoming",
//     displayStatus: "UPCOMING",
//   };
// };

// // ============================================
// // BUILD EVENT CARD
// // ============================================

// const buildEventCard = (
//   event: SelectedEvent,
//   now: Date,
//   statsMap: Map<string, EventDateStats>,
//   date?: SelectedEventDate,
//   reactivation?: SelectedReactivation,
// ): InternalEventCard => {
//   const proposedDate =
//     reactivation?.dates[0];

//   const startDateTime =
//     date?.startDateTime ??
//     proposedDate?.startDateTime ??
//     null;

//   const endDateTime =
//     date?.endDateTime ??
//     proposedDate?.endDateTime ??
//     null;

//   const gateOpensAt =
//     date?.gateOpensAt ??
//     proposedDate?.gateOpensAt ??
//     null;

//   const timezone =
//     date?.timezone ??
//     proposedDate?.timezone ??
//     "Asia/Kolkata";

//   const reactivationId =
//     date?.reactivationId ??
//     reactivation?.id ??
//     null;

//   const cardType: OrganizerEventCardType =
//     reactivation
//       ? "REACTIVATION"
//       : date
//         ? "EVENT_DATE"
//         : "EVENT";

//   const cardId =
//     reactivation
//       ? `reactivation_${reactivation.id}`
//       : date
//         ? `date_${date.id}`
//         : `event_${event.id}`;

//   const stats = date
//     ? statsMap.get(date.id)
//     : undefined;

//   const bookedGuests =
//     stats?.bookedGuests ?? 0;

//   const grossTicketSales =
//     stats?.grossTicketSales ??
//     new Prisma.Decimal(0);

//   const totalCapacity =
//     getEventCapacity(event, date);

//   const remainingCapacity =
//     totalCapacity != null
//       ? Math.max(
//           0,
//           totalCapacity - bookedGuests,
//         )
//       : null;

//   const soldPercentage =
//     totalCapacity != null &&
//     totalCapacity > 0
//       ? Math.min(
//           100,
//           Number(
//             (
//               bookedGuests /
//               totalCapacity *
//               100
//             ).toFixed(2),
//           ),
//         )
//       : totalCapacity === 0
//         ? 0
//         : null;

//   const availability = date
//     ? getBookingAvailability(
//         event,
//         date,
//         bookedGuests,
//         totalCapacity,
//         now,
//       )
//     : {
//         isOnSale: false,
//         isSoldOut: false,
//         isBookingWindowOpen: false,
//       };

//   const classification = reactivation
//     ? getWorkflowStatus(reactivation.status)
//     : date
//       ? getDateDisplayStatus(
//           event,
//           date,
//           now,
//           availability,
//         )
//       : getWorkflowStatus(event.status);

//   const isToday = Boolean(
//     date &&
//     classification.group === "upcoming" &&
//     getLocalDateKey(
//       date.startDateTime,
//       timezone,
//     ) ===
//     getLocalDateKey(now, timezone),
//   );

//   const isOngoing = Boolean(
//     date &&
//     classification.group === "upcoming" &&
//     event.status === EventStatus.PUBLISHED &&
//     date.status === EventDateStatus.SCHEDULED &&
//     now >= date.startDateTime &&
//     now < getEffectiveEndTime(date),
//   );

//   const duration = getTripDuration(
//     event,
//     startDateTime,
//     endDateTime,
//     timezone,
//   );

//   const dateLabel = getEventDateLabel(
//     startDateTime,
//     endDateTime,
//     timezone,
//     duration.durationLabel,
//   );

//   const item: OrganizerEventListItem = {
//     id: event.id,

//     cardId,
//     cardType,

//     eventDateId: date?.id ?? null,
//     reactivationId,

//     title: event.title,
//     tagline: event.tagline,

//     photoUrl:
//       event.photos[0]?.photoUrl ?? null,

//     eventDurationType:
//       event.eventDurationType,

//     tripType: event.tripType,

//     status: event.status,

//     eventDateStatus:
//       date?.status ?? null,

//     eventReactiveStatus:
//       reactivation?.status ??
//       event.eventReactiveStatus,

//     displayStatus:
//       classification.displayStatus,

//     statusLabel:
//       statusLabels[
//         classification.displayStatus
//       ],

//     categoryId: event.categoryId,

//     startDateTime,
//     endDateTime,
//     gateOpensAt,

//     timezone,
//     dateLabel,

//     totalDays: duration.totalDays,
//     totalNights: duration.totalNights,
//     durationLabel: duration.durationLabel,

//     venueName:
//       event.venue?.venueName ?? null,

//     locationLabel:
//       getLocationLabel(event),

//     totalCapacity,
//     bookedGuests,
//     remainingCapacity,

//     soldPercentage,

//     soldLabel:
//       totalCapacity != null
//         ? `${bookedGuests}/${totalCapacity} sold`
//         : `${bookedGuests} sold`,

//     grossTicketSales:
//       grossTicketSales.toFixed(2),

//     currency: "INR",

//     isToday,
//     isOngoing,

//     isOnSale:
//       availability.isOnSale,

//     isReactivated:
//       Boolean(reactivationId),

//     currentStep: event.currentStep,
//     completedSteps: event.completedSteps,

//     createdAt:
//       reactivation?.createdAt ??
//       event.createdAt,

//     updatedAt:
//       reactivation?.updatedAt ??
//       event.updatedAt,
//   };

//   return {
//     group: classification.group,
//     item,
//   };
// };

// // ============================================
// // GET TAB COUNTS
// // ============================================

// const getEventCounts = (
//   cards: InternalEventCard[],
// ): OrganizerEventCounts => {
//   const counts: OrganizerEventCounts = {
//     all: cards.length,
//     upcoming: 0,
//     inReview: 0,
//     drafts: 0,
//     past: 0,
//     onSale: 0,
//     rejected: 0,
//     paused: 0,
//     approved: 0,
//   };

//   for (const card of cards) {
//     switch (card.group) {
//       case "upcoming":
//         counts.upcoming++;
//         break;

//       case "in_review":
//         counts.inReview++;
//         break;

//       case "drafts":
//         counts.drafts++;
//         break;

//       case "past":
//         counts.past++;
//         break;

//       case "rejected":
//         counts.rejected++;
//         break;

//       case "paused":
//         counts.paused++;
//         break;

//       case "approved":
//         counts.approved++;
//         break;
//     }

//     if (card.item.isOnSale) {
//       counts.onSale++;
//     }
//   }

//   return counts;
// };


// // ============================================
// // FILTER EVENT CARDS
// // ============================================

// const filterEventCards = (
//   cards: InternalEventCard[],
//   type: OrganizerEventListType,
// ): InternalEventCard[] => {
//   if (type === "all") {
//     return cards;
//   }

//   if (type === "on_sale") {
//     return cards.filter(
//       (card) => card.item.isOnSale,
//     );
//   }

//   return cards.filter(
//     (card) => card.group === type,
//   );
// };


// // ============================================
// // SORT EVENT CARDS
// // ============================================

// const sortEventCards = (
//   cards: InternalEventCard[],
// ): InternalEventCard[] => {
//   const groupPriority: Record<
//     EventCardGroup,
//     number
//   > = {
//     upcoming: 1,
//     in_review: 2,
//     drafts: 3,
//     approved: 4,
//     rejected: 5,
//     paused: 6,
//     past: 7,
//   };

//   return [...cards].sort((a, b) => {
//     const priorityDifference =
//       groupPriority[a.group] -
//       groupPriority[b.group];

//     if (priorityDifference !== 0) {
//       return priorityDifference;
//     }

//     if (a.group === "upcoming") {
//       // Today and ongoing events appear first.

//       const aPriority =
//         a.item.isOngoing || a.item.isToday
//           ? 0
//           : 1;

//       const bPriority =
//         b.item.isOngoing || b.item.isToday
//           ? 0
//           : 1;

//       if (aPriority !== bPriority) {
//         return aPriority - bPriority;
//       }

//       const aTime =
//         a.item.startDateTime?.getTime() ??
//         Number.MAX_SAFE_INTEGER;

//       const bTime =
//         b.item.startDateTime?.getTime() ??
//         Number.MAX_SAFE_INTEGER;

//       if (aTime !== bTime) {
//         return aTime - bTime;
//       }
//     }

//     if (a.group === "past") {
//       const aTime =
//         a.item.endDateTime?.getTime() ??
//         a.item.startDateTime?.getTime() ??
//         a.item.updatedAt.getTime();

//       const bTime =
//         b.item.endDateTime?.getTime() ??
//         b.item.startDateTime?.getTime() ??
//         b.item.updatedAt.getTime();

//       if (aTime !== bTime) {
//         return bTime - aTime;
//       }
//     }

//     const updatedDifference =
//       b.item.updatedAt.getTime() -
//       a.item.updatedAt.getTime();

//     return (
//       updatedDifference ||
//       a.item.cardId.localeCompare(
//         b.item.cardId,
//       )
//     );
//   });
// };

// // ============================================
// // GET ALL ORGANIZER EVENTS SERVICE
// // ============================================

// export const getAllOrganizerEventsService = async (
//   params: GetAllOrganizerEventsParams,
// ) => {
//   const {
//     businessId,

//     type,
//     search,

//     eventDurationType,
//     tripType,
//     categoryId,

//     status,
//     eventReactiveStatus,
//     eventDateStatus,

//     page,
//     limit,
//   } = params;

//   const now = new Date();

//   const skip = (page - 1) * limit;


//   // ==========================================
//   // 1. BASE EVENT FILTER
//   // ==========================================

//   const where: Prisma.EventWhereInput = {
//     businessDetailsId: businessId,

//     isDeleted: false,
//     deletedAt: null,
//   };


//   // ==========================================
//   // 2. OPTIONAL FILTERS
//   // ==========================================

//   if (eventDurationType) {
//     where.eventDurationType =
//       eventDurationType;
//   }

//   if (tripType) {
//     where.tripType = tripType;
//   }

//   if (categoryId) {
//     where.categoryId = categoryId;
//   }

//   if (status) {
//     where.status = status;
//   }


//   // ==========================================
//   // 3. SEARCH FILTER
//   // ==========================================

//   if (search) {
//     where.OR = [
//       {
//         title: {
//           contains: search,
//           mode: "insensitive",
//         },
//       },

//       {
//         tagline: {
//           contains: search,
//           mode: "insensitive",
//         },
//       },

//       {
//         about: {
//           contains: search,
//           mode: "insensitive",
//         },
//       },
//     ];
//   }


//   // ==========================================
//   // 4. FETCH EVENTS AND BOOKING STATS
//   // ==========================================

//   const { events, statsMap } =
//     await prisma.$transaction(
//       async (tx) => {
//         const events = await tx.event.findMany({
//           where,

//           select: organizerEventSelect,

//           orderBy: [
//             {
//               updatedAt: "desc",
//             },
//             {
//               id: "asc",
//             },
//           ],
//         });

//         const eventDateIds = events.flatMap(
//           (event) =>
//             event.dates.map(
//               (date) => date.id,
//             ),
//         );

//         const statsMap =
//           await getEventDateStats(
//             tx,
//             businessId,
//             eventDateIds,
//           );

//         return {
//           events,
//           statsMap,
//         };
//       },

//       {
//         isolationLevel:
//           Prisma.TransactionIsolationLevel
//             .RepeatableRead,

//         timeout: 15000,
//       },
//     );


//   // ==========================================
//   // 5. BUILD EVENT CARDS
//   // ==========================================

//   const cards: InternalEventCard[] = [];

//   for (const event of events) {
//     const isWorkflowEvent = [
//       EventStatus.DRAFT,
//       EventStatus.SUBMITTED,
//       EventStatus.UNDER_REVIEW,
//       EventStatus.APPROVED,
//       EventStatus.REJECTED,
//     ].some(
//       (value) => value === event.status,
//     );


//     // ----------------------------------------
//     // A. Draft / Review / Approved / Rejected
//     // ----------------------------------------

//     if (isWorkflowEvent) {
//       const preferredDate =
//         event.dates.find(
//           (date) => date.isPrimary,
//         ) ??
//         event.dates[0];

//       const card = buildEventCard(
//         event,
//         now,
//         statsMap,
//       );

//       // Show the proposed date for workflow
//       // events without creating separate cards.

//       if (preferredDate) {
//         const duration = getTripDuration(
//           event,
//           preferredDate.startDateTime,
//           preferredDate.endDateTime,
//           preferredDate.timezone,
//         );

//         card.item.startDateTime =
//           preferredDate.startDateTime;

//         card.item.endDateTime =
//           preferredDate.endDateTime;

//         card.item.gateOpensAt =
//           preferredDate.gateOpensAt;

//         card.item.timezone =
//           preferredDate.timezone;

//         card.item.totalDays =
//           duration.totalDays;

//         card.item.totalNights =
//           duration.totalNights;

//         card.item.durationLabel =
//           duration.durationLabel;

//         card.item.dateLabel =
//           getEventDateLabel(
//             preferredDate.startDateTime,
//             preferredDate.endDateTime,
//             preferredDate.timezone,
//             duration.durationLabel,
//           );
//       }

//       cards.push(card);
//     }


//     // ----------------------------------------
//     // B. Published / Past / Paused Events
//     // ----------------------------------------

//     else if (event.dates.length > 0) {
//       for (const date of event.dates) {
//         const card = buildEventCard(
//           event,
//           now,
//           statsMap,
//           date,
//         );

//         cards.push(card);
//       }
//     }


//     // ----------------------------------------
//     // C. Event Without Dates
//     // ----------------------------------------

//     else {
//       cards.push(
//         buildEventCard(
//           event,
//           now,
//           statsMap,
//         ),
//       );
//     }


//     // ----------------------------------------
//     // D. Reactivation Workflow Cards
//     // ----------------------------------------

//     for (
//       const reactivation of event.reactivations
//     ) {
//       const card = buildEventCard(
//         event,
//         now,
//         statsMap,
//         undefined,
//         reactivation,
//       );

//       cards.push(card);
//     }
//   }


//   // ==========================================
//   // 6. APPLY DATE AND REACTIVATION FILTERS
//   // ==========================================

//   const eligibleCards = cards.filter(
//     ({ item }) => {
//       if (
//         eventDateStatus &&
//         item.eventDateStatus !==
//           eventDateStatus
//       ) {
//         return false;
//       }

//       if (
//         eventReactiveStatus &&
//         item.eventReactiveStatus !==
//           eventReactiveStatus
//       ) {
//         return false;
//       }

//       return true;
//     },
//   );


//   // ==========================================
//   // 7. GET ALL TAB COUNTS
//   // ==========================================

//   const counts = getEventCounts(
//     eligibleCards,
//   );


//   // ==========================================
//   // 8. APPLY SELECTED TAB FILTER
//   // ==========================================

//   const filteredCards = filterEventCards(
//     eligibleCards,
//     type,
//   );


//   // ==========================================
//   // 9. SORT EVENTS
//   // ==========================================

//   const sortedCards = sortEventCards(
//     filteredCards,
//   );


//   // ==========================================
//   // 10. PAGINATION
//   // ==========================================

//   const total = sortedCards.length;

//   const totalPages = Math.ceil(
//     total / limit,
//   );

//   const items = sortedCards
//     .slice(skip, skip + limit)
//     .map((card) => card.item);


//   // ==========================================
//   // 11. FINAL RESPONSE
//   // ==========================================

//   return {
//     counts,

//     filters: {
//       type,
//       search: search ?? null,

//       eventDurationType:
//         eventDurationType ?? null,

//       tripType: tripType ?? null,
//       categoryId: categoryId ?? null,

//       status: status ?? null,

//       eventReactiveStatus:
//         eventReactiveStatus ?? null,

//       eventDateStatus:
//         eventDateStatus ?? null,
//     },

//     items,

//     pagination: {
//       page,
//       limit,
//       total,
//       totalPages,

//       hasNextPage:
//         page * limit < total,

//       hasPreviousPage:
//         page > 1,
//     },
//   };
// };