
import { EventVisibility, Prisma } from "@prisma/client";

import {
  GetUserEventsQuery,
  TicketInput,
  UserEventServiceError,
} from "./userEvent.types";

import {
  getUserEventMembership,
  findUserPublishedEvents,
} from "./userEvent.repository";

import { prisma } from "../../../prisma/prismaClient";

// ======================================================
// CONVERT DECIMAL TO NUMBER
// ======================================================

const decimalToNumber = (
  value: Prisma.Decimal | null,
): number | null => {
  return value === null
    ? null
    : value.toNumber();
};

// ======================================================
// GET DAY NAME FROM EVENT DATE
// ======================================================

const getDayName = (
  date: Date,
  timezone: string,
): string => {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: timezone,
  }).format(date);
};

// ======================================================
// GET USER EVENTS SERVICE
// ======================================================


export const getAllUserEventsService = async (
  userId: string | null,
  query: GetUserEventsQuery,
) => {
  const now = new Date();

  const { page, limit } = query;

  // STEP 1 - Resolve guest or authenticated user membership

 const membership = userId
  ? await getUserEventMembership(userId, now)
  : {
      packageType: "FREE" as const,

      visibility: EventVisibility.FREE_AND_PREMIUM,
    };

  console.log("[USER EVENTS] Membership:", {
    userId,
    isAuthenticated: !!userId,
    packageType: membership.packageType,
    visibility: membership.visibility,
  });

  // STEP 2 - Get published events based on visibility

  const { events, total } =
    await findUserPublishedEvents(
      membership.visibility,
      page,
      limit,
      now,
    );

  // STEP 3 - Format event card response

  const items = events.map((event) => {
    // Nearest upcoming event date

    const eventDate = event.dates[0] ?? null;

    // Merge all stay amenities without duplicates

    const amenities = [
      ...new Set(
        event.tripDetails?.stays.flatMap(
          (stay) => stay.amenities,
        ) ?? [],
      ),
    ];

    return {
      // BASIC DETAILS

      eventId: event.id,

      title: event.title,

      eventDurationType: event.eventDurationType,

      tripType: event.tripType,

      visibility: event.visibility,

      category: event.category,

      coverPhoto:
        event.photos[0]?.photoUrl ?? null,

      // EVENT DATE DETAILS

      eventDateId: eventDate?.id ?? null,

      startDateTime:
        eventDate?.startDateTime ?? null,

      startDay: eventDate
        ? getDayName(
            eventDate.startDateTime,
            eventDate.timezone,
          )
        : null,

      endDateTime:
        eventDate?.endDateTime ?? null,

      timezone:
        eventDate?.timezone ?? null,

      // ALL UPCOMING EVENT DATES

      dates: event.dates.map((date) => ({
        eventDateId: date.id,

        startDateTime: date.startDateTime,

        startDay: getDayName(
          date.startDateTime,
          date.timezone,
        ),

        endDateTime: date.endDateTime,

        timezone: date.timezone,

        isPrimary: date.isPrimary,

        isMoreDate: date.isMoreDate,
      })),

      // VENUE DETAILS

      venueName:
        event.venue?.venueName ?? null,

      fullAddress:
        event.venue?.fullAddress ?? null,

      // PRICE TYPE

      priceType: event.priceType,

      // CAPACITY

      totalCapacity: event.totalCapacity,

      menCapacity: event.menCapacity,

      womenCapacity: event.womenCapacity,

      otherCapacity: event.otherCapacity,

      coupleCapacity: event.coupleCapacity,

      // ENTRY PRICES

      menEntryPrice: decimalToNumber(
        event.menEntryPrice,
      ),

      womenEntryPrice: decimalToNumber(
        event.womenEntryPrice,
      ),

      otherEntryPrice: decimalToNumber(
        event.otherEntryPrice,
      ),

      coupleEntryPrice: decimalToNumber(
        event.coupleEntryPrice,
      ),

      // DISCOUNT PERCENTAGES

      menDiscountPercentage: decimalToNumber(
        event.menDiscountPercentage,
      ),

      womenDiscountPercentage: decimalToNumber(
        event.womenDiscountPercentage,
      ),

      otherDiscountPercentage: decimalToNumber(
        event.otherDiscountPercentage,
      ),

      coupleDiscountPercentage: decimalToNumber(
        event.coupleDiscountPercentage,
      ),

      // DISCOUNTED PRICES

      menDiscountedPrice: decimalToNumber(
        event.menDiscountedPrice,
      ),

      womenDiscountedPrice: decimalToNumber(
        event.womenDiscountedPrice,
      ),

      otherDiscountedPrice: decimalToNumber(
        event.otherDiscountedPrice,
      ),

      coupleDiscountedPrice: decimalToNumber(
        event.coupleDiscountedPrice,
      ),

      // AGE AND GROUP

      minAge: event.minAge,

      maxAge: event.maxAge,

      groupSize: event.groupSize,

      // MULTI DAY TRIP DETAILS

      totalDays:
        event.eventDurationType === "SINGLE_DAY"
          ? 1
          : event.tripDetails?.totalDays ?? null,

      dayNumber:
        event.tripDetails?.days.map(
          (day) => day.dayNumber,
        ) ?? [],

      journeyThere:
        event.tripDetails?.journeyThere ?? null,

      journeyBack:
        event.tripDetails?.journeyBack ?? null,

      amenities,

      pickupCity:
        event.tripDetails?.pickupCity ?? null,

      pickupPoint:
        event.tripDetails?.pickupPoint ?? null,

      exactPickupSpot:
        event.tripDetails?.exactPickupSpot ?? null,

      destinationPlace:
        event.tripDetails?.destinationPlace ?? null,

      destinationArea:
        event.tripDetails?.destinationArea ?? null,

      // DAY WISE AMENITIES

      tripDays:
        event.tripDetails?.days.map((day) => ({
          dayNumber: day.dayNumber,

          amenities: day.stay?.amenities ?? [],
        })) ?? [],
    };
  });

  // STEP 4 - Return response

  return {
    isAuthenticated: !!userId,

    packageType: membership.packageType,

    visibility: membership.visibility,

    items,

    pagination: {
      page,
      limit,
      total,

      totalPages: Math.ceil(total / limit),

      hasNextPage: page * limit < total,

      hasPreviousPage: page > 1,
    },
  };
};


 // ======================================================
// GET PUBLISHED USER EVENT DETAILS BY ID
// ======================================================

export const getUserEventByIdService = async (
  eventId: string,
  userId: string | null,
) => {
  const now = new Date();

  console.log("[USER EVENT DETAILS] Request:", {
    eventId,
    userId,
    isAuthenticated: !!userId,
  });

  // ====================================================
  // STEP 1 - RESOLVE USER MEMBERSHIP
  // ====================================================

  const membership = userId
    ? await getUserEventMembership(userId, now)
    : {
        packageType: "FREE" as const,

        visibility:
          EventVisibility.FREE_AND_PREMIUM,
      };

  console.log("[USER EVENT DETAILS] Membership:", {
    packageType: membership.packageType,
    visibility: membership.visibility,
  });

  // ====================================================
  // STEP 2 - NORMALIZE EVENT VISIBILITY
  // ====================================================

  const allowedVisibilities: EventVisibility[] =
    Array.isArray(membership.visibility)
      ? membership.visibility
      : [membership.visibility];

  // ====================================================
  // STEP 3 - AVAILABLE EVENT DATE FILTER
  // ====================================================

  const availableDateWhere: Prisma.EventDateWhereInput = {
    status: "SCHEDULED",

    startDateTime: {
      gt: now,
    },

    OR: [
      {
        reactivationId: null,
      },
      {
        reactivation: {
          is: {
            status: "PUBLISHED",
          },
        },
      },
    ],
  };

  // ====================================================
  // STEP 4 - FETCH PUBLISHED EVENT DETAILS
  // ====================================================

  const event = await prisma.event.findFirst({
    where: {
      id: eventId,

      status: "PUBLISHED",

      isDeleted: false,

      deletedAt: null,

      visibility: {
        in: allowedVisibilities,
      },

      dates: {
        some: availableDateWhere,
      },
    },

    select: {
      // ================================================
      // BASIC EVENT DETAILS
      // ================================================
id: true,
businessDetailsId: true,

// ================================================
// ORGANIZER BUSINESS DETAILS
// ================================================

businessDetails: {
  select: {
    id: true,
    legalName: true,
    brandName: true,
    logoUrl: true,

    gstVerificationStatus: true,
    panVerificationStatus: true,
    mcaVerificationStatus: true,

    _count: {
      select: {
        events: {
          where: {
            isDeleted: false,
            deletedAt: null,
          },
        },
      },
    },
  },
},

      eventDurationType: true,
      tripType: true,

      categoryId: true,

      title: true,
      tagline: true,
      about: true,
      visibility: true,

      highlightsCaption: true,
      experienceSubtitle: true,

      // ================================================
      // EVENT CATEGORY
      // ================================================

      category: {
        select: {
          id: true,
          label: true,
          value: true,
          icon: true,
          eventDurationType: true,
          sortOrder: true,
          isActive: true,
        },
      },

      // ================================================
      // EVENT AND HIGHLIGHT PHOTOS
      // ================================================

      photos: {
        where: {
          photoType: {
            in: ["EVENT", "HIGHLIGHT"],
          },
        },

        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          eventId: true,
          photoUrl: true,
          photoType: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      // ================================================
      // EVENT DATES
      // ================================================

      dates: {
        where: availableDateWhere,

        orderBy: {
          startDateTime: "asc",
        },

        select: {
          id: true,
          eventId: true,

          startDateTime: true,
          endDateTime: true,
          gateOpensAt: true,

          timezone: true,
          status: true,

          isPrimary: true,
          isMoreDate: true,

          reactivationId: true,
        },
      },

      // ================================================
      // EVENT VENUE
      // ================================================

      venue: {
        select: {
          id: true,

          venueName: true,
          fullAddress: true,
          venueType: true,
          venueCapacity: true,

          whySpecial: true,
          tags: true,
          photoUrl: true,

          exactMeetingPoint: true,
          distanceFromCity: true,
          landmark: true,
          parking: true,
          publicTransport: true,

          googleMapsLink: true,
          latitude: true,
          longitude: true,
        },
      },

      // ================================================
      // EVENT EXPERIENCE
      // ================================================

      experience: {
        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          icon: true,
          time: true,
          title: true,
          description: true,
          photoUrl: true,
          tags: true,
          location: true,
          sortOrder: true,
        },
      },

      // ================================================
      // EVENT PRICE TYPE
      // ================================================

      priceType: true,

      // ================================================
      // EVENT CAPACITY
      // ================================================

      totalCapacity: true,

      menCapacity: true,
      womenCapacity: true,
      otherCapacity: true,
      coupleCapacity: true,

      // ================================================
      // ORIGINAL ENTRY PRICES
      // ================================================

      menEntryPrice: true,
      womenEntryPrice: true,
      otherEntryPrice: true,
      coupleEntryPrice: true,

      // ================================================
      // DISCOUNT PERCENTAGES
      // ================================================

      menDiscountPercentage: true,
      womenDiscountPercentage: true,
      otherDiscountPercentage: true,
      coupleDiscountPercentage: true,

      // ================================================
      // DISCOUNTED ENTRY PRICES
      // ================================================

      menDiscountedPrice: true,
      womenDiscountedPrice: true,
      otherDiscountedPrice: true,
      coupleDiscountedPrice: true,

      maxTicketsPerPerson: true,
      waitlistEnabled: true,

      // ================================================
      // CROWD AND AGE DETAILS
      // ================================================

      crowdMix: true,
      minAge: true,
      maxAge: true,
      groupSize: true,
      intent: true,

      // ================================================
      // EVENT INCLUSIONS
      // ================================================

      included: true,
      notIncluded: true,

      // ================================================
      // BEFORE YOU GO
      // ================================================

      whatToBring: true,
      dressCode: true,

      // ================================================
      // GROUP CHAT DETAILS
      // ================================================

      groupChatTitle: true,
      groupChatDescription: true,
      groupChatOpensAt: true,

      // ================================================
      // EVENT REMINDERS
      // ================================================

      reminderTitle: true,
      reminderDescription: true,
      reminderTimes: true,

      // ================================================
      // PUBLIC HOST DETAILS
      // ================================================

      hostId: true,
      hostPhotoUrl: true,
      hostTitle: true,
      hostSpeciality: true,
      hostLanguages: true,
      hostMessage: true,

      host: {
        select: {
          id: true,
        },
      },

      // ================================================
      // AFTER EVENT
      // ================================================

      afterEventLine: true,

      // ================================================
      // EVENT POLICIES
      // ================================================

      cancellationPolicy: true,
      cancellationDescription: true,
      refundPolicy: true,
      reschedulingPolicy: true,

      // ================================================
      // SAFETY AND RULES
      // ================================================

      rules: true,
      safetyOptions: true,

      // ================================================
      // MULTI DAY TRIP DETAILS
      // ================================================

      tripDetails: {
        select: {
          totalDays: true,

          journeyThere: true,
          journeyBack: true,

          pickupCity: true,
          pickupPoint: true,
          exactPickupSpot: true,

          destinationPlace: true,
          destinationArea: true,

          stays: {
            select: {
              amenities: true,
            },
          },

          days: {
            orderBy: {
              dayNumber: "asc",
            },

            select: {
              dayNumber: true,

              stay: {
                select: {
                  amenities: true,
                },
              },
            },
          },
        },
      },

      // ================================================
      // EVENT FAQS
      // ================================================

      faqs: {
        orderBy: {
          sortOrder: "asc",
        },

        select: {
          id: true,
          question: true,
          answer: true,
          sortOrder: true,
        },
      },

      // ================================================
      // EVENT RATINGS
      // ================================================

      averageRating: true,
      totalReviews: true,

      // ================================================
      // PUBLICATION STATUS
      // ================================================

      status: true,
      publishedAt: true,
    },
  });

  // ====================================================
  // STEP 5 - VALIDATE EVENT ACCESS
  // ====================================================

  if (!event) {
    console.log(
      "[USER EVENT DETAILS] Event unavailable:",
      eventId,
    );

    throw new UserEventServiceError(
      "Event not found or currently unavailable",
      404,
    );
  }

  // ====================================================
  // STEP 6 - GET NEAREST UPCOMING EVENT DATE
  // ====================================================

  const eventDate = event.dates[0] ?? null;

  // ====================================================
  // STEP 7 - PREPARE EVENT DETAILS RESPONSE
  // ====================================================

 const { businessDetails, ...eventDetails } = event;

// ================================================
// ORGANIZER VERIFICATION
// ================================================

const isVerifiedOrganizer = businessDetails
  ? (
      businessDetails.gstVerificationStatus === "VERIFIED" ||
      businessDetails.panVerificationStatus === "VERIFIED"
    ) &&
    businessDetails.mcaVerificationStatus === "VERIFIED"
  : false;

// ================================================
// PREPARE RESPONSE
// ================================================

const result = {
  ...eventDetails,

  organizer: businessDetails
    ? {
        businessId: businessDetails.id,
        legalName: businessDetails.legalName,
        brandName: businessDetails.brandName,
        logoUrl: businessDetails.logoUrl,

        isVerifiedOrganizer,

        totalEvents: businessDetails._count.events,
      }
    : null,

  isAuthenticated: !!userId,

  packageType: membership.packageType,

  currency: "INR",

  eventDateId: eventDate?.id ?? null,

  startDateTime:
    eventDate?.startDateTime ?? null,

  endDateTime:
    eventDate?.endDateTime ?? null,

  startDay: eventDate
    ? getDayName(
        eventDate.startDateTime,
        eventDate.timezone,
      )
    : null,

  timezone: eventDate?.timezone ?? null,

  coverPhoto:
    event.photos.find(
      (photo) => photo.photoType === "EVENT",
    )?.photoUrl ?? null,
};

  console.log(
    "[USER EVENT DETAILS] Event fetched successfully:",
    {
      eventId: event.id,
      title: event.title,
      packageType: membership.packageType,
      totalPhotos: event.photos.length,
      totalDates: event.dates.length,
    },
  );

  return result;
};


// ======================================================
// CALCULATE EVENT CHECKOUT WITH EXISTING TRANSACTION
// ======================================================
// Used by:
// 1. User checkout calculation API
// 2. Razorpay event booking creation
// 3. Other event payment integrations
//
// IMPORTANT:
// Do not create prisma.$transaction inside this function.
// Use the transaction client received from the caller.
// ======================================================

export const calculateEventCheckoutWithTx = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  eventDateId: string,
  userId: string,
  tickets: TicketInput[],
  couponCode?: string,
) => {
  const now = new Date();

  // ==================================================
  // STEP 1 - GET EVENT DETAILS
  // ==================================================

  const event = await tx.event.findFirst({
    where: {
      id: eventId,
      isDeleted: false,
      deletedAt: null,
    },

    select: {
      id: true,
      title: true,

      eventDurationType: true,
      tripType: true,
      priceType: true,

      status: true,
      eventReactiveStatus: true,

      totalCapacity: true,
      maxTicketsPerPerson: true,

      // Individual ticket capacity

      menCapacity: true,
      womenCapacity: true,
      otherCapacity: true,

      // Individual original prices

      menEntryPrice: true,
      womenEntryPrice: true,
      otherEntryPrice: true,

      // Individual discount percentages

      menDiscountPercentage: true,
      womenDiscountPercentage: true,
      otherDiscountPercentage: true,

      // Individual discounted prices

      menDiscountedPrice: true,
      womenDiscountedPrice: true,
      otherDiscountedPrice: true,

      // Couple pricing

      coupleCapacity: true,
      coupleEntryPrice: true,
      coupleDiscountPercentage: true,
      coupleDiscountedPrice: true,
    },
  });

  if (!event) {
    throw new Error("Event not found");
  }

  // ==================================================
  // STEP 2 - VALIDATE EVENT STATUS
  // ==================================================

  if (event.status !== "PUBLISHED") {
    throw new Error(
      "This event is currently not available for booking",
    );
  }

  // ==================================================
  // STEP 3 - VALIDATE EVENT DATE
  // ==================================================

  const eventDate = await tx.eventDate.findFirst({
    where: {
      id: eventDateId,
      eventId,
    },

    select: {
      id: true,
      eventId: true,

      startDateTime: true,
      endDateTime: true,
      timezone: true,

      status: true,
      reactivationId: true,

      reactivation: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!eventDate) {
    throw new Error("Event date not found");
  }

  if (eventDate.status !== "SCHEDULED") {
    throw new Error(
      "This event date is not available for booking",
    );
  }

  if (eventDate.startDateTime <= now) {
    throw new Error(
      "Booking is closed because the event has already started",
    );
  }

  if (
    eventDate.endDateTime &&
    eventDate.endDateTime <= now
  ) {
    throw new Error("This event date has expired");
  }

  // Validate reactivated event

  if (
    eventDate.reactivationId &&
    eventDate.reactivation?.status !== "PUBLISHED"
  ) {
    throw new Error(
      "This reactivated event is not available for booking",
    );
  }

  // ==================================================
  // STEP 4 - VALIDATE TICKETS
  // ==================================================

  if (
    !Array.isArray(tickets) ||
    tickets.length === 0
  ) {
    throw new Error("Tickets are required");
  }

  const validTicketTypes = [
    "MEN",
    "WOMEN",
    "OTHER",
    "COUPLE",
  ];

  const selectedTicketTypes = new Set<string>();

  let requestedTicketCount = 0;
  let requestedGuestCount = 0;

  for (const ticket of tickets) {
    const quantity = Number(ticket.quantity);

    if (
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 100
    ) {
      throw new Error("Invalid ticket quantity");
    }

    if (
      !validTicketTypes.includes(ticket.ticketType)
    ) {
      throw new Error("Invalid ticket type");
    }

    if (
      selectedTicketTypes.has(ticket.ticketType)
    ) {
      throw new Error(
        "Duplicate ticket type is not allowed",
      );
    }

    selectedTicketTypes.add(ticket.ticketType);

    // Couples trip only supports COUPLE tickets

    if (
      event.priceType === "PER_COUPLE" &&
      ticket.ticketType !== "COUPLE"
    ) {
      throw new Error(
        "Only couple tickets are allowed for this event",
      );
    }

    // Single-day and group trips

    if (
      event.priceType === "PER_PERSON" &&
      ticket.ticketType === "COUPLE"
    ) {
      throw new Error(
        "Couple tickets are not available for this event",
      );
    }

    requestedTicketCount += quantity;

    requestedGuestCount +=
      ticket.ticketType === "COUPLE"
        ? quantity * 2
        : quantity;
  }

  // ==================================================
  // STEP 5 - CHECK EXISTING RESERVED TICKETS
  // ==================================================

  const reservedTickets =
    await tx.eventBookingTicket.groupBy({
      by: ["ticketType"],

      where: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "ATTENDED",
          ],
        },

        booking: {
          eventId,
          eventDateId,

          status: {
            in: [
              "PENDING",
              "PAYMENT_PENDING",
              "CONFIRMED",
              "ATTENDED",
              "REFUND_PENDING",
            ],
          },
        },
      },

      _count: {
        _all: true,
      },
    });

  const bookedCapacity = {
    MEN: 0,
    WOMEN: 0,
    OTHER: 0,
    COUPLE: 0,
  };

  for (const item of reservedTickets) {
    bookedCapacity[item.ticketType] =
      item._count._all;
  }

  const totalBookedGuests =
    bookedCapacity.MEN +
    bookedCapacity.WOMEN +
    bookedCapacity.OTHER +
    bookedCapacity.COUPLE * 2;

  // ==================================================
  // STEP 6 - CHECK MAXIMUM TICKETS PER PERSON
  // ==================================================

  const existingUserTicketCount =
    await tx.eventBookingTicket.count({
      where: {
        status: {
          in: [
            "PENDING",
            "CONFIRMED",
            "ATTENDED",
          ],
        },

        booking: {
          userId,
          eventId,
          eventDateId,

          status: {
            in: [
              "PENDING",
              "PAYMENT_PENDING",
              "CONFIRMED",
              "ATTENDED",
              "REFUND_PENDING",
            ],
          },
        },
      },
    });

  if (
    existingUserTicketCount +
      requestedTicketCount >
    event.maxTicketsPerPerson
  ) {
    throw new Error(
      `Maximum ${event.maxTicketsPerPerson} ticket(s) allowed per person for this event date`,
    );
  }

  // ==================================================
  // STEP 7 - CHECK TOTAL EVENT CAPACITY
  // ==================================================

  if (
    event.totalCapacity !== null &&
    totalBookedGuests + requestedGuestCount >
      event.totalCapacity
  ) {
    throw new Error(
      "Requested tickets exceed available event capacity",
    );
  }

  // ==================================================
  // STEP 8 - GET GLOBAL PLATFORM FEE AND GST
  // ==================================================

  const globalAmount =
    await tx.globalAmount.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

  const gstPercentage =
    globalAmount?.gst ??
    new Prisma.Decimal(0);

  const platformFee =
    globalAmount?.eventPlatformFee ??
    new Prisma.Decimal(0);

  if (
    gstPercentage.lt(0) ||
    gstPercentage.gt(100) ||
    platformFee.lt(0)
  ) {
    throw new Error(
      "Invalid checkout fee configuration",
    );
  }

  // ==================================================
  // STEP 9 - PREPARE TICKET PRICING CONFIGURATION
  // ==================================================

  const ticketPricing = {
    MEN: {
      capacity: event.menCapacity ?? 0,

      originalPrice: event.menEntryPrice,

      discountedPrice: event.menDiscountedPrice,

      discountPercentage:
        event.menDiscountPercentage,
    },

    WOMEN: {
      capacity: event.womenCapacity ?? 0,

      originalPrice: event.womenEntryPrice,

      discountedPrice:
        event.womenDiscountedPrice,

      discountPercentage:
        event.womenDiscountPercentage,
    },

    OTHER: {
      capacity: event.otherCapacity ?? 0,

      originalPrice: event.otherEntryPrice,

      discountedPrice:
        event.otherDiscountedPrice,

      discountPercentage:
        event.otherDiscountPercentage,
    },

    COUPLE: {
      capacity: event.coupleCapacity ?? 0,

      originalPrice: event.coupleEntryPrice,

      discountedPrice:
        event.coupleDiscountedPrice,

      discountPercentage:
        event.coupleDiscountPercentage,
    },
  };

  // ==================================================
  // STEP 10 - INITIALIZE CHECKOUT AMOUNTS
  // ==================================================

  let originalTicketAmount =
    new Prisma.Decimal(0);

  let ticketAmount =
    new Prisma.Decimal(0);

  let ticketCount = 0;
  let guestCount = 0;

  const ticketBreakdown = [];

  // ==================================================
  // STEP 11 - CALCULATE INDIVIDUAL TICKET AMOUNTS
  // ==================================================

  for (const ticket of tickets) {
    const quantity = Number(ticket.quantity);

    const pricing =
      ticketPricing[ticket.ticketType];

    const capacity = pricing.capacity;

    const alreadyBooked =
      bookedCapacity[ticket.ticketType];

    const availableCapacity = Math.max(
      0,
      capacity - alreadyBooked,
    );

    if (capacity <= 0) {
      throw new Error(
        `${ticket.ticketType} tickets are not available`,
      );
    }

    if (quantity > availableCapacity) {
      throw new Error(
        `Only ${availableCapacity} ${ticket.ticketType} ticket(s) available`,
      );
    }

    // Do not treat missing prices as free tickets

    if (pricing.originalPrice === null) {
      throw new Error(
        `Price is not configured for ${ticket.ticketType} tickets`,
      );
    }

    const originalPrice =
      pricing.originalPrice;

    const discountPercentage =
      pricing.discountPercentage ??
      new Prisma.Decimal(0);

    if (
      originalPrice.lt(0) ||
      discountPercentage.lt(0) ||
      discountPercentage.gt(100)
    ) {
      throw new Error(
        `Invalid pricing for ${ticket.ticketType} tickets`,
      );
    }

    // Use saved discounted price first.
    // Otherwise calculate from discount percentage.

    const finalPrice = (
      pricing.discountedPrice ??
      originalPrice.minus(
        originalPrice
          .mul(discountPercentage)
          .div(100),
      )
    ).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

    if (
      finalPrice.lt(0) ||
      finalPrice.gt(originalPrice)
    ) {
      throw new Error(
        `Invalid discounted price for ${ticket.ticketType} tickets`,
      );
    }

    // Same calculation as your old service

    const originalAmount =
      originalPrice.mul(quantity);

    const amount =
      finalPrice.mul(quantity);

    const ticketDiscount =
      originalAmount.minus(amount);

    originalTicketAmount =
      originalTicketAmount.plus(originalAmount);

    ticketAmount =
      ticketAmount.plus(amount);

    ticketCount += quantity;

    const guests =
      ticket.ticketType === "COUPLE"
        ? quantity * 2
        : quantity;

    guestCount += guests;

    ticketBreakdown.push({
      ticketType: ticket.ticketType,

      quantity,

      guestCount: guests,

      capacity,

      bookedTickets: alreadyBooked,

      availableTickets: availableCapacity,

      discountPercentage:
        discountPercentage.toFixed(2),

      originalUnitPrice:
        originalPrice.toFixed(2),

      unitPrice:
        finalPrice.toFixed(2),

      originalAmount:
        originalAmount.toFixed(2),

      discountAmount:
        ticketDiscount.toFixed(2),

      amount:
        amount.toFixed(2),
    });
  }

  // ==================================================
  // STEP 12 - CALCULATE TICKET DISCOUNT
  // ==================================================

  const discountAmount =
    originalTicketAmount.minus(ticketAmount);

  // ==================================================
  // STEP 13 - CALCULATE SUBTOTAL
  // ==================================================

  // Platform fee charged once per checkout,
  // same as your old service.

  const subtotal = ticketAmount
    .plus(platformFee)
    .toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

  // ==================================================
  // STEP 14 - CALCULATE GST
  // ==================================================

  const gstAmount = subtotal
    .mul(gstPercentage)
    .div(100)
    .toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

  // ==================================================
  // STEP 15 - TOTAL BEFORE COUPON
  // ==================================================

  const totalBeforeCoupon =
    subtotal.plus(gstAmount);

  // ==================================================
  // STEP 16 - COUPON DISCOUNT
  // ==================================================

  // Temporary coupon logic.
  // Enable only for controlled development testing.

  const normalizedCouponCode =
    couponCode?.trim() || null;

  if (
    normalizedCouponCode &&
    process.env.ALLOW_TEST_EVENT_COUPON !== "true"
  ) {
    throw new Error("Invalid or unavailable coupon");
  }

  const requestedCouponDiscount =
    normalizedCouponCode
      ? new Prisma.Decimal(100)
      : new Prisma.Decimal(0);

  // Prevent negative checkout amount

  const couponDiscount =
    Prisma.Decimal.min(
      requestedCouponDiscount,
      totalBeforeCoupon,
    );

  // ==================================================
  // STEP 17 - FINAL PAYABLE AMOUNT
  // ==================================================

  const totalAmount = totalBeforeCoupon
    .minus(couponDiscount)
    .toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP,
    );

  // ==================================================
  // STEP 18 - RETURN CHECKOUT RESPONSE
  // ==================================================

  return {
    eventId: event.id,

    eventDateId: eventDate.id,

    reactivationId:
      eventDate.reactivationId,

    title: event.title,

    eventDurationType:
      event.eventDurationType,

    tripType: event.tripType,

    priceType: event.priceType,

    startDateTime:
      eventDate.startDateTime,

    endDateTime:
      eventDate.endDateTime,

    timezone:
      eventDate.timezone,

    currency: "INR",

    ticketCount,

    guestCount,

    maxTicketsPerPerson:
      event.maxTicketsPerPerson,

    ticketBreakdown,

    originalTicketAmount:
      originalTicketAmount.toFixed(2),

    ticketAmount:
      ticketAmount.toFixed(2),

    discountAmount:
      discountAmount.toFixed(2),

    platformFee:
      platformFee.toFixed(2),

    subtotal:
      subtotal.toFixed(2),

    gstPercentage:
      gstPercentage.toFixed(2),

    gstAmount:
      gstAmount.toFixed(2),

    totalBeforeCoupon:
      totalBeforeCoupon.toFixed(2),

    couponCode:
      normalizedCouponCode,

    couponDiscount:
      couponDiscount.toFixed(2),

    totalSavings:
      discountAmount
        .plus(couponDiscount)
        .toFixed(2),

    totalAmount:
      totalAmount.toFixed(2),
  };
};

// ======================================================
// CALCULATE EVENT CHECKOUT SERVICE
// ======================================================
// Used by the existing user checkout controller.
//
// POST /api/user/events/:eventId/checkout/calculate
//
// Read-only transaction.
// Does not create booking, payment or ticket records.
// ======================================================

export const calculateEventCheckout = async (
  eventId: string,
  eventDateId: string,
  userId: string,
  tickets: TicketInput[],
  couponCode?: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      return calculateEventCheckoutWithTx(
        tx,
        eventId,
        eventDateId,
        userId,
        tickets,
        couponCode,
      );
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.RepeatableRead,

      maxWait: 5000,

      timeout: 15000,
    },
  );
};
