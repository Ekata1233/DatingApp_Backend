import { Prisma } from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import { GetAllAdminEventsQuery, ReviewAdminEventInput } from "./adminEvent.validation";

// ======================================================
// ADMIN EVENT LIST SELECT
// ======================================================

const adminEventListSelect = {
  id: true,

  title: true,

  eventDurationType: true,

  tripType: true,

  // Category
  category: {
    select: {
      id: true,
      label: true,
      value: true,
      icon: true,
    },
  },

  // Host
  hostId: true,

  host: {
    select: {
      id: true,
    },
  },

  hostPhotoUrl: true,
  hostTitle: true,
  hostSpeciality: true,

  // Single-day venue
  venue: {
    select: {
      venueName: true,
      fullAddress: true,
    },
  },

  // All event dates
  dates: {
    select: {
      id: true,
      startDateTime: true,
      endDateTime: true,
      timezone: true,
      isPrimary: true,
      isMoreDate: true,
      status: true,
    },

    orderBy: {
      startDateTime: "asc",
    },
  },

  // Multi-day trip details
  tripDetails: {
    select: {
      totalDays: true,

      pickupCity: true,
      pickupPoint: true,
      exactPickupSpot: true,

      destinationPlace: true,
      destinationArea: true,

      days: {
        select: {
          dayNumber: true,
          headline: true,
        },

        orderBy: {
          dayNumber: "asc",
        },
      },
    },
  },

  // Pricing type
  priceType: true,

  // Capacity
  totalCapacity: true,
  menCapacity: true,
  womenCapacity: true,
  otherCapacity: true,
  coupleCapacity: true,

  // Original prices
  menEntryPrice: true,
  womenEntryPrice: true,
  otherEntryPrice: true,
  coupleEntryPrice: true,

  // Discount percentages
  menDiscountPercentage: true,
  womenDiscountPercentage: true,
  otherDiscountPercentage: true,
  coupleDiscountPercentage: true,

  // Final discounted prices
  menDiscountedPrice: true,
  womenDiscountedPrice: true,
  otherDiscountedPrice: true,
  coupleDiscountedPrice: true,

  // Event status
  status: true,

  submittedAt: true,
  approvedAt: true,
  publishedAt: true,
  rejectionReason: true,

  createdAt: true,
  updatedAt: true,

} satisfies Prisma.EventSelect;

// ======================================================
// GET ALL EVENTS FOR ADMIN
// ======================================================

export const getAllAdminEventsService = async (
  query: GetAllAdminEventsQuery
) => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  // No event status or organizer filter
  const where: Prisma.EventWhereInput = {
    isDeleted: false,
    deletedAt: null,
  };

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,

      select: adminEventListSelect,

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      skip,
      take: limit,
    }),

    prisma.event.count({
      where,
    }),
  ]);

  // Format response
  const items = events.map((event) => {
    const primaryDate =
      event.dates.find((date) => date.isPrimary) ??
      event.dates[0] ??
      null;

    return {
      eventId: event.id,

      title: event.title,

      eventDurationType: event.eventDurationType,

      tripType: event.tripType,

      category: event.category,

      // Host details
      host: event.host
        ? {
            id: event.host.id,
            photoUrl: event.hostPhotoUrl,
            title: event.hostTitle,
            speciality: event.hostSpeciality,
          }
        : null,

      // Single-day venue
      venueName: event.venue?.venueName ?? null,

      fullAddress: event.venue?.fullAddress ?? null,

      // Multi-day destination
      destinationPlace:
        event.tripDetails?.destinationPlace ?? null,

      destinationArea:
        event.tripDetails?.destinationArea ?? null,

      pickupCity:
        event.tripDetails?.pickupCity ?? null,

      pickupPoint:
        event.tripDetails?.pickupPoint ?? null,

      exactPickupSpot:
        event.tripDetails?.exactPickupSpot ?? null,

      // Primary event date
      startDate: primaryDate?.startDateTime ?? null,

      endDate: primaryDate?.endDateTime ?? null,

      timezone: primaryDate?.timezone ?? null,

      // All available event dates
      dates: event.dates.map((date) => ({
        id: date.id,

        startDate: date.startDateTime,

        endDate: date.endDateTime,

        timezone: date.timezone,

        isPrimary: date.isPrimary,

        isMoreDate: date.isMoreDate,

        status: date.status,
      })),

      // Multi-day itinerary
      totalDays:
        event.eventDurationType === "SINGLE_DAY"
          ? 1
          : event.tripDetails?.totalDays ?? null,

      tripDays: event.tripDetails?.days ?? [],

      // Pricing
      priceType: event.priceType,

      // Capacity
      totalCapacity: event.totalCapacity,

      menCapacity: event.menCapacity,

      womenCapacity: event.womenCapacity,

      otherCapacity: event.otherCapacity,

      coupleCapacity: event.coupleCapacity,

      // Entry prices
      menEntryPrice: event.menEntryPrice,

      womenEntryPrice: event.womenEntryPrice,

      otherEntryPrice: event.otherEntryPrice,

      coupleEntryPrice: event.coupleEntryPrice,

      // Discount percentages
      menDiscountPercentage:
        event.menDiscountPercentage,

      womenDiscountPercentage:
        event.womenDiscountPercentage,

      otherDiscountPercentage:
        event.otherDiscountPercentage,

      coupleDiscountPercentage:
        event.coupleDiscountPercentage,

      // Discounted prices
      menDiscountedPrice: event.menDiscountedPrice,

      womenDiscountedPrice: event.womenDiscountedPrice,

      otherDiscountedPrice: event.otherDiscountedPrice,

      coupleDiscountedPrice: event.coupleDiscountedPrice,

      // Status
      status: event.status,

      submittedAt: event.submittedAt,

      approvedAt: event.approvedAt,

      publishedAt: event.publishedAt,

      rejectionReason: event.rejectionReason,

      createdAt: event.createdAt,

      updatedAt: event.updatedAt,
    };
  });

  return {
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

export class AdminEventServiceError extends Error {
  public readonly statusCode: number;

  constructor(
    message: string,
    statusCode: number = 400
  ) {
    super(message);

    this.name = "AdminEventServiceError";
    this.statusCode = statusCode;
  }
}

// ======================================================
// ADMIN APPROVE / REJECT EVENT
// ======================================================

export const reviewAdminEventService = async (
  eventId: string,
  input: ReviewAdminEventInput
) => {
  return prisma.$transaction(
    async (tx) => {
      // STEP 1 - Find existing event
      const existingEvent = await tx.event.findFirst({
        where: {
          id: eventId,
          isDeleted: false,
          deletedAt: null,
        },

        select: {
          id: true,
          title: true,
          status: true,
          submittedAt: true,
          approvedAt: true,
          rejectionReason: true,
        },
      });

      // STEP 2 - Check event exists
      if (!existingEvent) {
        throw new AdminEventServiceError(
          "Event not found",
          404
        );
      }

      // STEP 3 - Prevent duplicate approval
      if (existingEvent.status === "APPROVED") {
        throw new AdminEventServiceError(
          "Event is already approved",
          409
        );
      }

      // STEP 4 - Prevent duplicate rejection
      if (existingEvent.status === "REJECTED") {
        throw new AdminEventServiceError(
          "Event is already rejected. Organizer must resubmit the event before review.",
          409
        );
      }

      // STEP 5 - Validate current event status
      if (
        existingEvent.status !== "SUBMITTED" &&
        existingEvent.status !== "UNDER_REVIEW"
      ) {
        throw new AdminEventServiceError(
          `Event cannot be reviewed while its status is ${existingEvent.status}`,
          409
        );
      }

      // STEP 6 - Prepare approval or rejection data
      const updateData: Prisma.EventUpdateManyMutationInput =
        input.status === "APPROVED"
          ? {
              status: "APPROVED",
              approvedAt: new Date(),
              rejectionReason: null,
            }
          : {
              status: "REJECTED",
              approvedAt: null,
              rejectionReason: input.rejectionReason,
            };

      // STEP 7 - Update event status
      const updatedEvent = await tx.event.updateMany({
        where: {
          id: eventId,

          isDeleted: false,
          deletedAt: null,

          status: {
            in: [
              "SUBMITTED",
              "UNDER_REVIEW",
            ],
          },
        },

        data: updateData,
      });

      // STEP 8 - Prevent concurrent review conflicts
      if (updatedEvent.count !== 1) {
        throw new AdminEventServiceError(
          "Event status has changed. Please refresh and try again.",
          409
        );
      }

      // STEP 9 - Return updated event details
      const event = await tx.event.findUniqueOrThrow({
        where: {
          id: eventId,
        },

        select: {
          id: true,
          title: true,
          eventDurationType: true,
          tripType: true,
          status: true,
          submittedAt: true,
          approvedAt: true,
          publishedAt: true,
          rejectionReason: true,
          updatedAt: true,
        },
      });

      return event;
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,

      timeout: 30000,
    }
  );
};