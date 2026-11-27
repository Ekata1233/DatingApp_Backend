import {
  Prisma,
  EventReactiveStatus,
} from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import { EventServiceError } from "./event.types";

import {
  SaveReactivationInput,
  GetReactivationQuery,
  ReactivationDateInput,
  PauseReactivationInput,
  CompleteReactivationInput,
  CancelReactivationInput,
} from "./event.reactivation.types";

import {
  reactivationInclude,
  findOwnedReactivation,
  findAllReactivations,
} from "./event.reactivation.repository";
import { finalizeReactivationStatus, getReactivationLifecycleResult, validateActiveReactivation } from "./event.reactivation.lifecycle";

const transactionOptions = {
  isolationLevel:
    Prisma.TransactionIsolationLevel.Serializable,

  maxWait: 5000,

  timeout: 20000,
};

// ======================================================
// VALIDATE ORIGINAL EVENT
// ======================================================

const validateOriginalEvent = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  eventId: string
) => {
  const event = await tx.event.findFirst({
    where: {
      id: eventId,
      businessDetailsId: businessId,
      isDeleted: false,
      deletedAt: null,
    },
  });

  if (!event) {
    throw new EventServiceError(
      "Event not found",
      404
    );
  }

 if (
  event.status !== "COMPLETED" &&
  event.status !== "EXPIRED" &&
  event.status !== "PAUSED" &&
  event.status !== "CANCELLED"
) {
  throw new EventServiceError(
    "Only paused, completed, cancelled or expired events can be reactivated",
    409,
  );
}

  return event;
};

// ======================================================
// VALIDATE NEW EVENT DATES
// ======================================================

const validateNewDates = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  dates: ReactivationDateInput[]
) => {
  const now = new Date();

  if (dates.length === 0) {
    throw new EventServiceError(
      "At least one new event date is required",
      400
    );
  }

  const sortedDates = [...dates].sort(
    (a, b) =>
      a.startDateTime.getTime() -
      b.startDateTime.getTime()
  );

  for (let i = 0; i < sortedDates.length; i++) {
    const date = sortedDates[i];

    if (date.startDateTime <= now) {
      throw new EventServiceError(
        "All new event dates must be in the future",
        400
      );
    }

    if (date.endDateTime <= date.startDateTime) {
      throw new EventServiceError(
        "End date must be after start date",
        400
      );
    }

    if (
      date.gateOpensAt &&
      date.gateOpensAt > date.startDateTime
    ) {
      throw new EventServiceError(
        "Gate opening time cannot be after event start",
        400
      );
    }

    if (
      i > 0 &&
      date.startDateTime <
        sortedDates[i - 1].endDateTime
    ) {
      throw new EventServiceError(
        "New event dates cannot overlap",
        400
      );
    }
  }

  // Prevent duplicate historical dates

  const existingDate = await tx.eventDate.findFirst({
    where: {
      eventId,

      startDateTime: {
        in: dates.map((date) => date.startDateTime),
      },
    },

    select: {
      id: true,
      startDateTime: true,
    },
  });

  if (existingDate) {
    throw new EventServiceError(
      "One of the selected dates already exists for this event",
      409
    );
  }

  // Existing scheduled dates must not be silently
  // replaced or republished.

  const scheduledDates = await tx.eventDate.count({
    where: {
      eventId,
      status: "SCHEDULED",
    },
  });

  if (scheduledDates > 0) {
    throw new EventServiceError(
      "Resolve existing scheduled dates before creating new event occurrences",
      409
    );
  }
};

// ======================================================
// PREPARE PRIMARY AND ADDITIONAL DATES
// ======================================================

const prepareDates = (
  dates: ReactivationDateInput[]
) => {
  const sortedDates = [...dates].sort(
    (a, b) =>
      a.startDateTime.getTime() -
      b.startDateTime.getTime()
  );

  const hasPrimary = sortedDates.some(
    (date) => date.isPrimary
  );

  return sortedDates.map((date, index) => {
    const isPrimary = hasPrimary
      ? date.isPrimary
      : index === 0;

    return {
      startDateTime: date.startDateTime,
      endDateTime: date.endDateTime,
      gateOpensAt: date.gateOpensAt ?? null,
      timezone: date.timezone,
      isPrimary,
      isMoreDate: !isPrimary,
    };
  });
};

// ======================================================
// SYNC LATEST REACTIVATION STATUS
// ======================================================

const syncReactivationStatus = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  status: EventReactiveStatus
) => {
  await tx.event.update({
    where: {
      id: eventId,
    },

    data: {
      eventReactiveStatus: status,
    },
  });
};

// ======================================================
// CREATE REACTIVATION DRAFT
// ======================================================

export const createReactivationService = async (
  businessId: string,
  eventId: string,
  input: SaveReactivationInput
) => {
  return prisma.$transaction(
    async (tx) => {
      const event = await validateOriginalEvent(
        tx,
        businessId,
        eventId
      );

      // Allow only one unfinished request per event.

      const existingRequest =
        await tx.eventReactivation.findFirst({
          where: {
            eventId,

            status: {
              in: [
                "DRAFT",
                "SUBMITTED",
                "UNDER_REVIEW",
                "APPROVED",
                "REJECTED",
              ],
            },
          },

          select: {
            id: true,
            status: true,
          },
        });

      if (existingRequest) {
        throw new EventServiceError(
          `A reactivation request already exists with status ${existingRequest.status}`,
          409
        );
      }

      await validateNewDates(
        tx,
        eventId,
        input.dates
      );

      const reactivation =
        await tx.eventReactivation.create({
          data: {
            eventId,

            previousEventStatus: event.status,

            status: "DRAFT",

            dates: {
              create: prepareDates(input.dates),
            },
          },
        });

      await syncReactivationStatus(
        tx,
        eventId,
        "DRAFT"
      );

      return tx.eventReactivation.findUniqueOrThrow({
        where: {
          id: reactivation.id,
        },

        include: reactivationInclude,
      });
    },

    transactionOptions
  );
};

// ======================================================
// UPDATE REACTIVATION DRAFT / REJECTED REQUEST
// ======================================================

export const updateReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string,
  input: SaveReactivationInput
) => {
  return prisma.$transaction(
    async (tx) => {
      await validateOriginalEvent(
        tx,
        businessId,
        eventId
      );

      const reactivation =
        await findOwnedReactivation(
          tx,
          businessId,
          eventId,
          reactivationId
        );

      if (!reactivation) {
        throw new EventServiceError(
          "Reactivation request not found",
          404
        );
      }

      if (
        reactivation.status !== "DRAFT" &&
        reactivation.status !== "REJECTED"
      ) {
        throw new EventServiceError(
          "Only draft or rejected requests can be updated",
          409
        );
      }

      await validateNewDates(
        tx,
        eventId,
        input.dates
      );

      // Delete only proposed dates.
      // Never delete original EventDate records.

      await tx.eventReactivationDate.deleteMany({
        where: {
          reactivationId,
        },
      });

      await tx.eventReactivationDate.createMany({
        data: prepareDates(input.dates).map(
          (date) => ({
            ...date,
            reactivationId,
          })
        ),
      });

      await tx.eventReactivation.update({
        where: {
          id: reactivationId,
        },

        data: {
          status: "DRAFT",
          submittedAt: null,
          reviewedAt: null,
          approvedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      await syncReactivationStatus(
        tx,
        eventId,
        "DRAFT"
      );

      return tx.eventReactivation.findUniqueOrThrow({
        where: {
          id: reactivationId,
        },

        include: reactivationInclude,
      });
    },

    transactionOptions
  );
};

// ======================================================
// SUBMIT REACTIVATION TO ADMIN
// ======================================================

export const submitReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string
) => {
  return prisma.$transaction(
    async (tx) => {
      await validateOriginalEvent(
        tx,
        businessId,
        eventId
      );

      const reactivation =
        await findOwnedReactivation(
          tx,
          businessId,
          eventId,
          reactivationId
        );

      if (!reactivation) {
        throw new EventServiceError(
          "Reactivation request not found",
          404
        );
      }

      if (
        reactivation.status !== "DRAFT" &&
        reactivation.status !== "REJECTED"
      ) {
        throw new EventServiceError(
          "Only draft or rejected requests can be submitted",
          409
        );
      }

      await validateNewDates(
        tx,
        eventId,
        reactivation.dates
      );

      await tx.eventReactivation.update({
        where: {
          id: reactivationId,
        },

        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
          reviewedAt: null,
          approvedAt: null,
          rejectedAt: null,
          rejectionReason: null,
        },
      });

      await syncReactivationStatus(
        tx,
        eventId,
        "SUBMITTED"
      );

      return tx.eventReactivation.findUniqueOrThrow({
        where: {
          id: reactivationId,
        },

        include: reactivationInclude,
      });
    },

    transactionOptions
  );
};

// ======================================================
// PUBLISH APPROVED REACTIVATION
// ======================================================

export const publishReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      await validateOriginalEvent(
        tx,
        businessId,
        eventId
      );

      const reactivation =
        await findOwnedReactivation(
          tx,
          businessId,
          eventId,
          reactivationId
        );

      if (!reactivation) {
        throw new EventServiceError(
          "Reactivation request not found",
          404
        );
      }

      if (reactivation.status === "PUBLISHED") {
        throw new EventServiceError(
          "Reactivation is already published",
          409
        );
      }

      if (reactivation.status !== "APPROVED") {
        throw new EventServiceError(
          "Admin approval is required before publishing",
          409
        );
      }

      // Revalidate dates because approval may
      // have taken several days.

      await validateNewDates(
        tx,
        eventId,
        reactivation.dates
      );

      // Create new actual EventDate records.
      // Original dates remain unchanged.

      await tx.eventDate.createMany({
        data: reactivation.dates.map((date) => ({
          eventId,

          reactivationId,

          startDateTime: date.startDateTime,

          endDateTime: date.endDateTime,

          gateOpensAt: date.gateOpensAt,

          timezone: date.timezone,

          isPrimary: date.isPrimary,

          isMoreDate: date.isMoreDate,

          status: "SCHEDULED",
        })),
      });

      // Update reactivation request

      await tx.eventReactivation.update({
        where: {
          id: reactivationId,
        },

        data: {
          status: "PUBLISHED",
          publishedAt: now,
        },
      });

      // Make original event live again

      await tx.event.update({
        where: {
          id: eventId,
        },

        data: {
          status: "PUBLISHED",

          eventReactiveStatus: "PUBLISHED",

          reactivatedAt: now,

          pausedAt: null,
          pauseReason: null,
          expiredAt: null,
          completedAt: null,
        },
      });

      return tx.eventReactivation.findUniqueOrThrow({
        where: {
          id: reactivationId,
        },

        include: reactivationInclude,
      });
    },

    transactionOptions
  );
};

// ======================================================
// GET ALL REACTIVATIONS
// ======================================================

export const getAllReactivationsService = async (
  businessId: string,
  eventId: string,
  query: GetReactivationQuery
) => {
  const event = await prisma.event.findFirst({
    where: {
      id: eventId,
      businessDetailsId: businessId,
      isDeleted: false,
      deletedAt: null,
    },

    select: {
      id: true,
    },
  });

  if (!event) {
    throw new EventServiceError(
      "Event not found",
      404
    );
  }

  return findAllReactivations(
    businessId,
    eventId,
    query
  );
};

// ======================================================
// GET SINGLE REACTIVATION
// ======================================================

export const getReactivationByIdService = async (
  businessId: string,
  eventId: string,
  reactivationId: string
) => {
  const reactivation = await findOwnedReactivation(
    prisma,
    businessId,
    eventId,
    reactivationId
  );

  if (!reactivation) {
    throw new EventServiceError(
      "Reactivation request not found",
      404
    );
  }

  return reactivation;
};

// ======================================================
// PAUSE REACTIVATED EVENT SERVICE
// ======================================================

export const pauseReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string,
  input: PauseReactivationInput,
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // STEP 1 - Validate event and reactivation
      const { event, reactivation } =
        await validateActiveReactivation(
          tx,
          businessId,
          eventId,
          reactivationId,
        );

      // STEP 2 - Prevent duplicate pause
      if (
        event.status === "PAUSED" ||
        reactivation.status === "PAUSED"
      ) {
        throw new EventServiceError(
          "Reactivated event is already paused",
          409,
        );
      }

      // STEP 3 - Check scheduled dates
      const scheduledDates = await tx.eventDate.count({
        where: {
          eventId,
          reactivationId,
          status: "SCHEDULED",

          endDateTime: {
            gt: now,
          },
        },
      });

      if (scheduledDates === 0) {
        throw new EventServiceError(
          "No active scheduled dates available to pause",
          409,
        );
      }

      // STEP 4 - Pause reactivation
      const updatedReactivation =
        await tx.eventReactivation.updateMany({
          where: {
            id: reactivationId,
            eventId,
            status: "PUBLISHED",
          },

          data: {
            status: "PAUSED",
            pausedAt: now,
            pauseReason: input.pauseReason,
          },
        });

      if (updatedReactivation.count !== 1) {
        throw new EventServiceError(
          "Reactivation status changed. Please retry.",
          409,
        );
      }

      // STEP 5 - Pause parent event
      const updatedEvent = await tx.event.updateMany({
        where: {
          id: eventId,
          businessDetailsId: businessId,
          isDeleted: false,
          deletedAt: null,
          status: "PUBLISHED",
        },

        data: {
          status: "PAUSED",
          eventReactiveStatus: "PAUSED",
          pausedAt: now,
          pauseReason: input.pauseReason,
        },
      });

      if (updatedEvent.count !== 1) {
        throw new EventServiceError(
          "Event status changed. Please retry.",
          409,
        );
      }

      // STEP 6 - Return updated data
      return getReactivationLifecycleResult(
        tx,
        eventId,
        reactivationId,
      );
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,
      timeout: 30000,
    },
  );
};

// ======================================================
// COMPLETE REACTIVATED EVENT SERVICE
// ======================================================

export const completeReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string,
  input: CompleteReactivationInput,
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // STEP 1 - Validate active reactivation
      await validateActiveReactivation(
        tx,
        businessId,
        eventId,
        reactivationId,
      );

      // STEP 2 - Find selected event date
      const eventDate = await tx.eventDate.findFirst({
        where: {
          id: input.eventDateId,
          eventId,
          reactivationId,
        },
      });

      if (!eventDate) {
        throw new EventServiceError(
          "Event date not found in this reactivation",
          404,
        );
      }

      // STEP 3 - Prevent duplicate completion
      if (eventDate.status === "COMPLETED") {
        throw new EventServiceError(
          "Event date is already completed",
          409,
        );
      }

      // STEP 4 - Validate event date status
      if (eventDate.status !== "SCHEDULED") {
        throw new EventServiceError(
          `Cannot complete event date with status ${eventDate.status}`,
          409,
        );
      }

      // STEP 5 - Prevent completion before start
      if (eventDate.startDateTime > now) {
        throw new EventServiceError(
          "Event has not started yet",
          400,
        );
      }

      if (!eventDate.endDateTime) {
        throw new EventServiceError(
          "Event end date and time is required",
          400,
        );
      }

      // Preserve existing expiry policy
      if (eventDate.endDateTime <= now) {
        throw new EventServiceError(
          "Event end time has passed",
          409,
        );
      }

      // STEP 6 - Complete selected event date
      const updatedDate = await tx.eventDate.updateMany({
        where: {
          id: input.eventDateId,
          eventId,
          reactivationId,
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

      // STEP 7 - Finalize parent if no dates remain
      await finalizeReactivationStatus(
        tx,
        eventId,
        reactivationId,
        now,
      );

      // STEP 8 - Return updated data
      const result =
        await getReactivationLifecycleResult(
          tx,
          eventId,
          reactivationId,
        );

      return {
        ...result,

        eventDateId: input.eventDateId,
        eventDateStatus: "COMPLETED",
        eventDateCompletedAt: now,
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,
      timeout: 30000,
    },
  );
};

// ======================================================
// CANCEL REACTIVATED EVENT SERVICE
// ======================================================

export const cancelReactivationService = async (
  businessId: string,
  eventId: string,
  reactivationId: string,
  input: CancelReactivationInput,
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      // STEP 1 - Validate active reactivation
      await validateActiveReactivation(
        tx,
        businessId,
        eventId,
        reactivationId,
      );

      // STEP 2 - Find selected event date
      const eventDate = await tx.eventDate.findFirst({
        where: {
          id: input.eventDateId,
          eventId,
          reactivationId,
        },
      });

      if (!eventDate) {
        throw new EventServiceError(
          "Event date not found in this reactivation",
          404,
        );
      }

      // STEP 3 - Prevent duplicate cancellation
      if (eventDate.status === "CANCELLED") {
        throw new EventServiceError(
          "Event date is already cancelled",
          409,
        );
      }

      // STEP 4 - Validate event date status
      if (eventDate.status !== "SCHEDULED") {
        throw new EventServiceError(
          `Cannot cancel event date with status ${eventDate.status}`,
          409,
        );
      }

      if (
        eventDate.endDateTime &&
        eventDate.endDateTime <= now
      ) {
        throw new EventServiceError(
          "Event end time has passed",
          409,
        );
      }

      // STEP 5 - Check bookings for selected date only
      const activeBookings = await tx.eventBooking.count({
        where: {
          eventId,
          eventDateId: input.eventDateId,

          status: {
            in: [
              "PENDING",
              "PAYMENT_PENDING",
              "CONFIRMED",
              "REFUND_PENDING",
              "ATTENDED",
            ],
          },
        },
      });

      if (activeBookings > 0) {
        throw new EventServiceError(
          "This event date has active bookings. Resolve bookings and refunds before cancellation.",
          409,
        );
      }

      // STEP 6 - Cancel selected event date
      const updatedDate = await tx.eventDate.updateMany({
        where: {
          id: input.eventDateId,
          eventId,
          reactivationId,
          status: "SCHEDULED",
        },

        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancellationReason: input.cancellationReason,
        },
      });

      if (updatedDate.count !== 1) {
        throw new EventServiceError(
          "Event date status changed. Please retry.",
          409,
        );
      }

      // STEP 7 - Finalize parent if no dates remain
      await finalizeReactivationStatus(
        tx,
        eventId,
        reactivationId,
        now,
      );

      // STEP 8 - Return updated data
      const result =
        await getReactivationLifecycleResult(
          tx,
          eventId,
          reactivationId,
        );

      return {
        ...result,

        eventDateId: input.eventDateId,
        eventDateStatus: "CANCELLED",
        eventDateCancelledAt: now,

        eventDateCancellationReason:
          input.cancellationReason,
      };
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,
      timeout: 30000,
    },
  );
};