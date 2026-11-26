import { Prisma } from "@prisma/client";

import {
  GetUserEventsQuery,
} from "./userEvent.types";

import {
  getUserEventMembership,
  findUserPublishedEvents,
} from "./userEvent.repository";

// ======================================================
// CONVERT DECIMAL TO NUMBER
// ======================================================

const decimalToNumber = (
  value: Prisma.Decimal | null
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
  timezone: string
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
  userId: string,
  query: GetUserEventsQuery
) => {
  const now = new Date();

  const { page, limit } = query;

  // STEP 1 - Get user's current membership
  const membership = await getUserEventMembership(
    userId,
    now
  );

  console.log("[USER EVENTS] Membership:", {
    userId,
    packageType: membership.packageType,
    visibility: membership.visibility,
  });

  // STEP 2 - Get published events
  const { events, total } =
    await findUserPublishedEvents(
      membership.visibility,
      page,
      limit,
      now
    );

  // STEP 3 - Format event card response
  const items = events.map((event) => {
    // Nearest upcoming event date
    const eventDate = event.dates[0] ?? null;

    // Merge all stay amenities without duplicates
    const amenities = [
      ...new Set(
        event.tripDetails?.stays.flatMap(
          (stay) => stay.amenities
        ) ?? []
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
            eventDate.timezone
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
          date.timezone
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
        event.menEntryPrice
      ),

      womenEntryPrice: decimalToNumber(
        event.womenEntryPrice
      ),

      otherEntryPrice: decimalToNumber(
        event.otherEntryPrice
      ),

      coupleEntryPrice: decimalToNumber(
        event.coupleEntryPrice
      ),

      // DISCOUNT PERCENTAGES
      menDiscountPercentage: decimalToNumber(
        event.menDiscountPercentage
      ),

      womenDiscountPercentage: decimalToNumber(
        event.womenDiscountPercentage
      ),

      otherDiscountPercentage: decimalToNumber(
        event.otherDiscountPercentage
      ),

      coupleDiscountPercentage: decimalToNumber(
        event.coupleDiscountPercentage
      ),

      // DISCOUNTED PRICES
      menDiscountedPrice: decimalToNumber(
        event.menDiscountedPrice
      ),

      womenDiscountedPrice: decimalToNumber(
        event.womenDiscountedPrice
      ),

      otherDiscountedPrice: decimalToNumber(
        event.otherDiscountedPrice
      ),

      coupleDiscountedPrice: decimalToNumber(
        event.coupleDiscountedPrice
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
          (day) => day.dayNumber
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