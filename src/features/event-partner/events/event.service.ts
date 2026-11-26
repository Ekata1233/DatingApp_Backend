import { Prisma } from "@prisma/client";

import {
  SaveEventInput,
  GetEventsQuery,
  EventFormat,
  EventServiceError,
} from "./event.types";

import { syncPublishedReactivationLifecycle } from "./event.reactivation.lifecycle";

import { prepareEventPricing } from "./event.pricing";

import {
  eventDetailsInclude,
  findOwnedEvent,
  saveEventRelations,
} from "./event.repository";
import { prisma } from "../../../prisma/prismaClient";

// Identify event format
const getEventFormat = (
  eventDurationType: string | null | undefined,
  tripType: string | null | undefined,
): EventFormat => {
  if (eventDurationType === "SINGLE_DAY") {
    if (tripType !== null && tripType !== undefined) {
      throw new EventServiceError(
        "tripType is not allowed for SINGLE_DAY events",
      );
    }

    return "SINGLE_DAY";
  }

  if (eventDurationType === "MULTI_DAY") {
    if (tripType === "GROUP_TRIP") {
      return "GROUP_TRIP";
    }

    if (tripType === "COUPLES_TRIP") {
      return "COUPLES_TRIP";
    }

    throw new EventServiceError("tripType is required for MULTI_DAY events");
  }

  throw new EventServiceError(
    "eventDurationType must be SINGLE_DAY or MULTI_DAY",
  );
};

// Validate category
const validateCategory = async (
  tx: Prisma.TransactionClient,
  categoryId: string,
  eventDurationType: string,
) => {
  const category = await tx.eventCategory.findFirst({
    where: {
      id: categoryId,
      isActive: true,
    },
  });

  if (!category) {
    throw new EventServiceError("Invalid or inactive event category", 400);
  }

  if (
    category.eventDurationType !== eventDurationType &&
    category.eventDurationType !== "BOTH"
  ) {
    throw new EventServiceError(
      "Selected category is not valid for this event duration",
    );
  }

  return category;
};

// Validate host ownership
const validateHost = async (
  tx: Prisma.TransactionClient,
  hostId: string,
  businessId: string,
) => {
  const host = await tx.host.findFirst({
    where: {
      id: hostId,
      businessId: businessId,
    },
    select: {
      id: true,
    },
  });

  if (!host) {
    throw new EventServiceError("Host does not belong to your business", 400);
  }
};

// Pricing field groups
const individualPricingFields = [
  "menCapacity",
  "womenCapacity",
  "otherCapacity",
  "menEntryPrice",
  "womenEntryPrice",
  "otherEntryPrice",
  "menDiscountPercentage",
  "womenDiscountPercentage",
  "otherDiscountPercentage",
] as const;

const couplePricingFields = [
  "coupleCapacity",
  "coupleEntryPrice",
  "coupleDiscountPercentage",
] as const;

// Validate fields based on event type
const validateEventFields = (format: EventFormat, input: SaveEventInput) => {
  if (format === "SINGLE_DAY") {
    if (input.tripDetails != null) {
      throw new EventServiceError(
        "Trip details are not allowed for SINGLE_DAY events",
      );
    }
  } else {
    if (input.venue != null) {
      throw new EventServiceError(
        "Event venue is not allowed for MULTI_DAY events",
      );
    }

    if (input.experience?.length) {
      throw new EventServiceError(
        "Event experience is not allowed for MULTI_DAY events",
      );
    }

    if (input.highlightsCaption != null || input.experienceSubtitle != null) {
      throw new EventServiceError(
        "Single-day highlight and experience fields are not allowed",
      );
    }

    if (input.photos?.some((photo) => photo.photoType === "HIGHLIGHT")) {
      throw new EventServiceError(
        "HIGHLIGHT photos are not allowed for MULTI_DAY events",
      );
    }
  }

  if (format === "COUPLES_TRIP") {
    if (input.priceType && input.priceType !== "PER_COUPLE") {
      throw new EventServiceError("COUPLES_TRIP requires PER_COUPLE pricing");
    }

    for (const field of individualPricingFields) {
      if (input[field] != null) {
        throw new EventServiceError(`${field} is not allowed for COUPLES_TRIP`);
      }
    }
  } else {
    if (input.priceType && input.priceType !== "PER_PERSON") {
      throw new EventServiceError("This event requires PER_PERSON pricing");
    }

    for (const field of couplePricingFields) {
      if (input[field] != null) {
        throw new EventServiceError(
          `${field} is only allowed for COUPLES_TRIP`,
        );
      }
    }
  }
};

// Prevent duplicate collection sort orders
const validateUniqueValues = (
  values: Array<string | number>,
  message: string,
) => {
  if (new Set(values).size !== values.length) {
    throw new EventServiceError(message);
  }
};

// Validate supplied nested collections
const validateCollections = (input: SaveEventInput) => {
  if (input.photos) {
    validateUniqueValues(
      input.photos.map((photo) => `${photo.photoType}-${photo.sortOrder}`),
      "Duplicate photo sort order",
    );
  }

  if (input.dates) {
    validateUniqueValues(
      input.dates.map((date) => date.startDateTime.getTime()),
      "Duplicate event start date",
    );

    const primaryCount = input.dates.filter((date) => date.isPrimary).length;

    if (primaryCount > 1) {
      throw new EventServiceError("Only one primary event date is allowed");
    }

    for (const date of input.dates) {
      if (date.startDateTime <= new Date()) {
        throw new EventServiceError("Event start date must be in the future");
      }
    }
  }

  if (input.experience) {
    validateUniqueValues(
      input.experience.map((item) => item.sortOrder),
      "Duplicate experience sort order",
    );
  }

  if (input.faqs) {
    validateUniqueValues(
      input.faqs.map((item) => item.sortOrder),
      "Duplicate FAQ sort order",
    );
  }

  if (input.tripDetails) {
    validateUniqueValues(
      (input.tripDetails.places ?? []).map((item) => item.sortOrder),
      "Duplicate trip place sort order",
    );

    validateUniqueValues(
      (input.tripDetails.roomOptions ?? []).map((item) => item.sortOrder),
      "Duplicate room option sort order",
    );

    for (const day of input.tripDetails.days ?? []) {
      validateUniqueValues(
        (day.stops ?? []).map((item) => item.sortOrder),
        `Duplicate stop sort order for day ${day.dayNumber}`,
      );

      validateUniqueValues(
        (day.games ?? []).map((item) => item.sortOrder),
        `Duplicate game sort order for day ${day.dayNumber}`,
      );
    }
  }
};

// ======================================================
// CREATE AND UPDATE EVENT - SINGLE PATCH API
// ======================================================

export const saveEventService = async (
  businessId: string,
  input: SaveEventInput,
) => {
  validateCollections(input);

  return prisma.$transaction(
    async (tx) => {
      const { eventId } = input;

      // Check existing event when updating
      const existingEvent = eventId
        ? await tx.event.findFirst({
            where: {
              id: eventId,
              businessDetailsId: businessId,

              isDeleted: false,
              deletedAt: null,
            },

            include: {
              _count: {
                select: {
                  bookings: true,
                  reviews: true,
                },
              },
            },
          })
        : null;

      if (eventId && !existingEvent) {
        throw new EventServiceError("Event not found", 404);
      }

      // Only editable drafts and rejected events
      if (existingEvent) {
        if (
          existingEvent.status !== "DRAFT" &&
          existingEvent.status !== "REJECTED"
        ) {
          throw new EventServiceError(
            "Only draft or rejected events can be updated",
            409,
          );
        }

        if (
          existingEvent._count.bookings > 0 ||
          existingEvent._count.reviews > 0
        ) {
          throw new EventServiceError(
            "Event has dependent bookings or reviews",
            409,
          );
        }

        // Prevent changing event duration
        if (
          input.eventDurationType !== undefined &&
          existingEvent.eventDurationType &&
          input.eventDurationType !== existingEvent.eventDurationType
        ) {
          throw new EventServiceError("Event duration type cannot be changed");
        }

        // Prevent changing trip type
        if (
          input.tripType !== undefined &&
          input.tripType !== existingEvent.tripType
        ) {
          throw new EventServiceError("Trip type cannot be changed");
        }
      }

      // Merge existing values with incoming values
      const mergedData = {
        ...existingEvent,
        ...input,
      };

      const eventDurationType = mergedData.eventDurationType;

      const tripType = mergedData.tripType ?? null;

      // Identify event format
      const format = getEventFormat(eventDurationType, tripType);

      validateEventFields(format, input);

      // Category validation
      if (mergedData.categoryId) {
        await validateCategory(tx, mergedData.categoryId, eventDurationType!);
      }

      // Host validation
      if (mergedData.hostId) {
        await validateHost(tx, mergedData.hostId, businessId);
      }

      // Age validation
      if (
        mergedData.minAge != null &&
        mergedData.maxAge != null &&
        mergedData.minAge > mergedData.maxAge
      ) {
        throw new EventServiceError("Minimum age cannot exceed maximum age");
      }

      // Calculate capacity and discounted prices
      const pricingData = prepareEventPricing(format, mergedData);

      // If frontend supplies totalCapacity,
      // verify it matches calculated capacity.
      if (
        input.totalCapacity !== undefined &&
        input.totalCapacity !== null &&
        input.totalCapacity !== pricingData.totalCapacity
      ) {
        throw new EventServiceError(
          `Invalid totalCapacity. Expected ${pricingData.totalCapacity}`,
        );
      }

      // Remove API-only and nested fields
      const {
        eventId: ignoredEventId,
        photos,
        dates,
        venue,
        experience,
        tripDetails,
        faqs,
        ...eventData
      } = input;

      const data = {
        ...eventData,

        ...pricingData,

        eventDurationType: eventDurationType!,

        tripType: format === "SINGLE_DAY" ? null : tripType,
      };

      let savedEventId: string;

      // UPDATE EVENT
      if (existingEvent) {
        const updatedEvent = await tx.event.updateMany({
          where: {
            id: existingEvent.id,
            businessDetailsId: businessId,

            isDeleted: false,
            deletedAt: null,
            status: {
              in: ["DRAFT", "REJECTED"],
            },
          },

          data,
        });

        if (updatedEvent.count !== 1) {
          throw new EventServiceError("Event is no longer editable", 409);
        }

        savedEventId = existingEvent.id;
      } else {
        // CREATE EVENT
        const newEvent = await tx.event.create({
          data: {
            ...data,
            businessDetailsId: businessId,
            status: "DRAFT",
          },
        });

        savedEventId = newEvent.id;
      }

      // Save all nested relations
      await saveEventRelations(tx, savedEventId, input);

      // Return complete saved event
      const event = await tx.event.findUniqueOrThrow({
        where: {
          id: savedEventId,
        },

        include: eventDetailsInclude,
      });

      return {
        isCreated: !existingEvent,
        event,
      };
    },

    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,
      timeout: 30000,
    },
  );
};

// ======================================================
// GET ALL EVENTS
// ======================================================

export const getAllEventsService = async (
  businessId: string,
  query: GetEventsQuery,
) => {
  const {
    page,
    limit,
    eventDurationType,
    tripType,
    categoryId,
    status,
    eventReactiveStatus,
    search,
  } = query;

  const where: Prisma.EventWhereInput = {
    businessDetailsId: businessId,

    isDeleted: false,
    deletedAt: null,

    ...(eventDurationType ? { eventDurationType } : {}),

    ...(tripType ? { tripType } : {}),

    ...(categoryId ? { categoryId } : {}),

    ...(status ? { status } : {}),
    ...(eventReactiveStatus ? { eventReactiveStatus } : {}),

    ...(search
      ? {
          OR: [
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
          ],
        }
      : {}),
  };

  const skip = (page - 1) * limit;

  const [events, total] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      skip,
      take: limit,

      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],

      select: {
        id: true,
        eventDurationType: true,
        tripType: true,
        title: true,
        tagline: true,
        visibility: true,
        status: true,
        eventReactiveStatus: true,

        reactivatedAt: true,

        pausedAt: true,
        pauseReason: true,

        expiredAt: true,
        completedAt: true,

        reactivations: {
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],

          take: 1,

          select: {
            id: true,
            status: true,
            previousEventStatus: true,
            submittedAt: true,
            approvedAt: true,
            rejectedAt: true,
            rejectionReason: true,
            publishedAt: true,

            dates: {
              orderBy: {
                startDateTime: "asc",
              },
            },
          },
        },
        categoryId: true,
        category: true,

        priceType: true,
        totalCapacity: true,

        menEntryPrice: true,
        womenEntryPrice: true,
        otherEntryPrice: true,
        coupleEntryPrice: true,

        menDiscountedPrice: true,
        womenDiscountedPrice: true,
        otherDiscountedPrice: true,
        coupleDiscountedPrice: true,

        averageRating: true,
        totalReviews: true,

        photos: {
          where: {
            photoType: "EVENT",
          },

          orderBy: {
            sortOrder: "asc",
          },

          take: 1,
        },

        dates: {
          where: {
            status: "SCHEDULED",
          },

          orderBy: {
            startDateTime: "asc",
          },

          take: 1,
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
            destinationPlace: true,
          },
        },

        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },

        createdAt: true,
        updatedAt: true,
      },
    }),

    prisma.event.count({
      where,
    }),
  ]);

  return {
    items: events,

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
// GET EVENT BY ID
// ======================================================

export const getEventByIdService = async (
  businessId: string,
  eventId: string,
) => {
  const event = await findOwnedEvent(eventId, businessId);

  if (!event) {
    throw new EventServiceError("Event not found", 404);
  }

  return event;
};

// ======================================================
// DELETE EVENT - SOFT DELETE
// ======================================================

export const deleteEventService = async (
  businessId: string,
  eventId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          businessDetailsId: businessId,

          isDeleted: false,
          deletedAt: null,
        },

        include: {
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      });

      if (!event) {
        throw new EventServiceError("Event not found", 404);
      }

      if (event.status !== "DRAFT" && event.status !== "REJECTED") {
        throw new EventServiceError(
          "Only draft or rejected events can be deleted",
          409,
        );
      }

      if (event._count.bookings > 0 || event._count.reviews > 0) {
        throw new EventServiceError(
          "Cannot delete an event with bookings or reviews",
          409,
        );
      }

      const deletedAt = new Date();

      const result = await tx.event.updateMany({
        where: {
          id: eventId,
          businessDetailsId: businessId,

          isDeleted: false,
          deletedAt: null,
          status: {
            in: ["DRAFT", "REJECTED"],
          },
        },

        data: {
          isDeleted: true,
          deletedAt,
        },
      });

      if (result.count !== 1) {
        throw new EventServiceError(
          "Event is no longer eligible for deletion",
          409,
        );
      }

      return {
        eventId,
        isDeleted: true,
        deletedAt,
      };
    },

    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
};

// ======================================================
// PREVIEW AND SUBMIT EVENT
// ======================================================

export const submitEventService = async (
  businessId: string,
  eventId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      // STEP 1 - Find event and verify ownership
      const existingEvent = await tx.event.findFirst({
        where: {
          id: eventId,
          businessDetailsId: businessId,

          isDeleted: false,
          deletedAt: null,
          isDeleted: false,
        },
      });

      if (!existingEvent) {
        throw new EventServiceError("Event not found", 404);
      }

      // STEP 2 - Prevent duplicate submission
      if (existingEvent.status === "SUBMITTED") {
        throw new EventServiceError(
          "Event is already submitted for review",
          409,
        );
      }

      // STEP 3 - Validate event status
      if (
        existingEvent.status !== "DRAFT" &&
        existingEvent.status !== "REJECTED"
      ) {
        throw new EventServiceError(
          "Only draft or rejected events can be submitted",
          409,
        );
      }

      // STEP 4 - Submit event
      const submittedAt = new Date();

      const updatedEvent = await tx.event.updateMany({
        where: {
          id: eventId,
          businessDetailsId: businessId,

          isDeleted: false,
          deletedAt: null,
          isDeleted: false,

          status: {
            in: ["DRAFT", "REJECTED"],
          },
        },

        data: {
          status: "SUBMITTED",
          submittedAt,
          rejectionReason: null,
        },
      });

      if (updatedEvent.count !== 1) {
        throw new EventServiceError(
          "Event is no longer available for submission",
          409,
        );
      }

      // STEP 5 - Return submitted event
      const event = await tx.event.findUniqueOrThrow({
        where: {
          id: eventId,
        },

        include: eventDetailsInclude,
      });

      return event;
    },

    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,
      timeout: 30000,
    },
  );
};

// ======================================================
// ORGANIZER PUBLISH EVENT
// ======================================================

export const publishEventService = async (
  businessId: string,
  eventId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      // STEP 1 - Find event and verify organizer ownership
      const existingEvent = await tx.event.findFirst({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
        },

        select: {
          id: true,
          title: true,
          status: true,
          approvedAt: true,
          publishedAt: true,
          rejectionReason: true,
        },
      });

      // STEP 2 - Check event exists
      if (!existingEvent) {
        throw new EventServiceError("Event not found", 404);
      }

      // STEP 3 - Prevent duplicate publishing
      if (existingEvent.status === "PUBLISHED") {
        throw new EventServiceError("Event is already published", 409);
      }

      // STEP 4 - Check rejected status
      if (existingEvent.status === "REJECTED") {
        throw new EventServiceError(
          "Rejected events cannot be published. Please update and resubmit the event for approval.",
          409,
        );
      }

      // STEP 5 - Only approved events can be published
      if (existingEvent.status !== "APPROVED") {
        throw new EventServiceError(
          "Only admin-approved events can be published",
          409,
        );
      }

      // STEP 6 - Verify event has an upcoming schedule
      const upcomingDate = await tx.eventDate.findFirst({
        where: {
          eventId,
          status: "SCHEDULED",

          startDateTime: {
            gt: new Date(),
          },
        },

        select: {
          id: true,
        },
      });

      if (!upcomingDate) {
        throw new EventServiceError(
          "Event must have at least one upcoming scheduled date before publishing",
          400,
        );
      }

      // STEP 7 - Generate publishing timestamp
      const publishedAt = new Date();

      // STEP 8 - Update event status
      const updatedEvent = await tx.event.updateMany({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
          status: "APPROVED",
        },

        data: {
          status: "PUBLISHED",
          publishedAt,
          rejectionReason: null,
        },
      });

      // STEP 9 - Prevent concurrent publishing
      if (updatedEvent.count !== 1) {
        throw new EventServiceError(
          "Event status has changed. Please refresh and try again.",
          409,
        );
      }

      // STEP 10 - Return published event
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
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,

      timeout: 30000,
    },
  );
};

// ======================================================
// PAUSE EVENT SERVICE
// ======================================================

export const pauseEventService = async (
  businessId: string,
  eventId: string,
  pauseReason: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });

      if (!event) {
        throw new EventServiceError("Event not found", 404);
      }

      if (event.status === "PAUSED") {
        throw new EventServiceError("Event is already paused", 409);
      }

      if (event.status !== "PUBLISHED") {
        throw new EventServiceError("Only published events can be paused", 400);
      }
      const now = new Date();

      const reason = pauseReason.trim();

      if (!reason) {
        throw new EventServiceError("Pause reason is required", 400);
      }
      const updated = await tx.event.updateMany({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
          status: "PUBLISHED",
        },
        data: {
          status: "PAUSED",
          pausedAt: now,
          pauseReason: reason,
        },
      });

      if (updated.count !== 1) {
        throw new EventServiceError("Event status changed. Please retry.", 409);
      }
      await syncPublishedReactivationLifecycle(
        tx,
        eventId,
        "PAUSED",
        now,
        reason,
      );

      return tx.event.findUniqueOrThrow({
        where: {
          id: eventId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          eventReactiveStatus: true,
          pausedAt: true,
          pauseReason: true,
          updatedAt: true,
        },
      });
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    },
  );
};

// ======================================================
// COMPLETE EVENT SERVICE
// ======================================================

export const completeEventService = async (
  businessId: string,
  eventId: string,
  eventDateId: string,
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // Check event ownership

      const event = await tx.event.findFirst({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          status: true,
        },
      });

      if (!event) {
        throw new EventServiceError("Event not found", 404);
      }

      if (event.status !== "PUBLISHED" && event.status !== "PAUSED") {
        throw new EventServiceError(
          "Only published or paused events can be completed",
          400,
        );
      }

      // Check selected event occurrence

      const eventDate = await tx.eventDate.findFirst({
        where: {
          id: eventDateId,
          eventId: eventId,
        },
      });

      if (!eventDate) {
        throw new EventServiceError("Event date not found", 404);
      }

      if (eventDate.status === "COMPLETED") {
        throw new EventServiceError(
          "This event date is already completed",
          409,
        );
      }

      if (eventDate.status !== "SCHEDULED") {
        throw new EventServiceError(
          `Cannot complete an event date with status ${eventDate.status}`,
          400,
        );
      }

      // Prevent completion before event starts

      if (eventDate.startDateTime > now) {
        throw new EventServiceError("Event has not started yet", 400);
      }

      if (!eventDate.endDateTime) {
        throw new EventServiceError("Event end date and time is required", 400);
      }

      // Event has already reached expiry time

      if (eventDate.endDateTime <= now) {
        throw new EventServiceError("Event end time has passed", 409);
      }

      // Complete selected event occurrence

      const updatedDate = await tx.eventDate.updateMany({
        where: {
          id: eventDateId,
          eventId: eventId,
          status: "SCHEDULED",
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
        },
      });

      if (updatedDate.count !== 1) {
        throw new EventServiceError(
          "Event date status changed. Please retry.",
          409,
        );
      }

      // Check remaining scheduled occurrences

      const remainingDates = await tx.eventDate.count({
        where: {
          eventId: eventId,
          status: "SCHEDULED",
        },
      });

      // Complete parent event only when
      // no scheduled occurrences remain

      if (remainingDates === 0) {
        const updatedEvent = await tx.event.updateMany({
          where: {
            id: eventId,
            businessDetailsId: businessId,
            isDeleted: false,

            isDeleted: false,
            deletedAt: null,
            status: {
              in: ["PUBLISHED", "PAUSED"],
            },
          },
          data: {
            status: "COMPLETED",
            completedAt: now,
          },
        });

        if (updatedEvent.count !== 1) {
          throw new EventServiceError(
            "Event status changed. Please retry.",
            409,
          );
        }
        await syncPublishedReactivationLifecycle(tx, eventId, "COMPLETED", now);
      }

      const result = await tx.event.findUniqueOrThrow({
        where: {
          id: eventId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          eventReactiveStatus: true,
          completedAt: true,
          updatedAt: true,
        },
      });

      return {
        ...result,
        eventDateId,
        eventDateStatus: "COMPLETED",
        eventDateCompletedAt: now,
        remainingScheduledDates: remainingDates,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 15000,
    },
  );
};

// ======================================================
// AUTO EXPIRE EVENT SERVICE
// ======================================================

export const expireEventsService = async () => {
  const now = new Date();

  // Find occurrences whose end date and time
  // has reached or passed the current time.

  const expiredDates = await prisma.eventDate.findMany({
    where: {
      status: "SCHEDULED",

      endDateTime: {
        lte: now,
      },

      event: {
        is: {
          isDeleted: false,

          isDeleted: false,
          deletedAt: null,
          status: {
            in: ["PUBLISHED", "PAUSED"],
          },
        },
      },
    },
    select: {
      id: true,
      eventId: true,
    },
    orderBy: {
      endDateTime: "asc",
    },
    take: 200,
  });

  if (expiredDates.length === 0) {
    return {
      expiredDateCount: 0,
      expiredEventCount: 0,
      failedEventCount: 0,
    };
  }

  // Unique parent event IDs

  const eventIds = [...new Set(expiredDates.map((date) => date.eventId))];

  let expiredDateCount = 0;
  let expiredEventCount = 0;
  let failedEventCount = 0;

  for (const eventId of eventIds) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const event = await tx.event.findFirst({
            where: {
              id: eventId,
              isDeleted: false,

              isDeleted: false,
              deletedAt: null,
              status: {
                in: ["PUBLISHED", "PAUSED"],
              },
            },
            select: {
              id: true,
            },
          });

          if (!event) {
            return {
              expiredDates: 0,
              expiredEvents: 0,
            };
          }

          // Expire all overdue scheduled dates
          // belonging to this event

          const updatedDates = await tx.eventDate.updateMany({
            where: {
              eventId: eventId,
              status: "SCHEDULED",
              endDateTime: {
                lte: now,
              },
            },
            data: {
              status: "EXPIRED",
              expiredAt: now,
            },
          });

          if (updatedDates.count === 0) {
            return {
              expiredDates: 0,
              expiredEvents: 0,
            };
          }

          // Check whether another occurrence remains

          const remainingDates = await tx.eventDate.count({
            where: {
              eventId: eventId,
              status: "SCHEDULED",
            },
          });

          let updatedEventCount = 0;

          // Expire parent event only when
          // all scheduled occurrences have ended

          if (remainingDates === 0) {
            const updatedEvent = await tx.event.updateMany({
              where: {
                id: eventId,
                isDeleted: false,

                isDeleted: false,
                deletedAt: null,
                status: {
                  in: ["PUBLISHED", "PAUSED"],
                },
              },
              data: {
                status: "EXPIRED",
                expiredAt: now,
              },
            });

            updatedEventCount = updatedEvent.count;
            if (updatedEventCount > 0) {
              await syncPublishedReactivationLifecycle(
                tx,
                eventId,
                "EXPIRED",
                now,
              );
            }
          }

          return {
            expiredDates: updatedDates.count,
            expiredEvents: updatedEventCount,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5000,
          timeout: 15000,
        },
      );

      expiredDateCount += result.expiredDates;
      expiredEventCount += result.expiredEvents;
    } catch (error) {
      failedEventCount++;

      console.error(`[EVENT EXPIRY] Failed for event ${eventId}:`, error);
    }
  }

  return {
    expiredDateCount,
    expiredEventCount,
    failedEventCount,
  };
};
