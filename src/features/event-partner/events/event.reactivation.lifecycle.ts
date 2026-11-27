import {
  Prisma,
  EventReactiveStatus,
} from "@prisma/client";
import { EventServiceError } from "./event.types";

type LifecycleStatus = Extract<
  EventReactiveStatus,
  "PAUSED" | "COMPLETED" | "EXPIRED" | "CANCELLED"
>;

export const syncPublishedReactivationLifecycle =
  async (
    tx: Prisma.TransactionClient,
    eventId: string,
    status: LifecycleStatus,
    now: Date,
    pauseReason?: string
  ) => {
    const reactivation =
      await tx.eventReactivation.findFirst({
        where: {
          eventId,

          status: {
            in: ["PUBLISHED", "PAUSED"],
          },
        },

        orderBy: {
          publishedAt: "desc",
        },

        select: {
          id: true,
          status: true,
        },
      });

    // Original first-time event has no reactivation.

    if (!reactivation) {
      return;
    }

    const data:
      Prisma.EventReactivationUpdateInput = {
        status,
      };

    if (status === "PAUSED") {
      data.pausedAt = now;
      data.pauseReason = pauseReason ?? null;
    }

    if (status === "COMPLETED") {
      data.completedAt = now;
    }

    if (status === "EXPIRED") {
      data.expiredAt = now;
    }

    if (status === "CANCELLED") {
      data.cancelledAt = now;
    }

    await tx.eventReactivation.update({
      where: {
        id: reactivation.id,
      },

      data,
    });

    // Do not overwrite a newer pending
    // reactivation request's status.

    const latestRequest =
      await tx.eventReactivation.findFirst({
        where: {
          eventId,
        },

        orderBy: [
          { createdAt: "desc" },
          { id: "desc" },
        ],

        select: {
          id: true,
        },
      });

    if (latestRequest?.id === reactivation.id) {
      await tx.event.update({
        where: {
          id: eventId,
        },

        data: {
          eventReactiveStatus: status,
        },
      });
    }
  };

  // ======================================================
// VALIDATE ACTIVE REACTIVATION
// ======================================================

export const validateActiveReactivation = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  eventId: string,
  reactivationId: string,
) => {
  // Check event ownership
  const event = await tx.event.findFirst({
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
      eventReactiveStatus: true,
    },
  });

  if (!event) {
    throw new EventServiceError(
      "Event not found",
      404,
    );
  }

  // Check reactivation ownership
  const reactivation =
    await tx.eventReactivation.findFirst({
      where: {
        id: reactivationId,
        eventId,
      },
    });

  if (!reactivation) {
    throw new EventServiceError(
      "Event reactivation not found",
      404,
    );
  }

  // Validate parent event status
  if (
    event.status !== "PUBLISHED" &&
    event.status !== "PAUSED"
  ) {
    throw new EventServiceError(
      `Cannot manage event with status ${event.status}`,
      409,
    );
  }

  // Validate reactivation status
  if (
    reactivation.status !== "PUBLISHED" &&
    reactivation.status !== "PAUSED"
  ) {
    throw new EventServiceError(
      `Cannot manage reactivation with status ${reactivation.status}`,
      409,
    );
  }

  if (event.status !== reactivation.status) {
    throw new EventServiceError(
      "Event and reactivation statuses are inconsistent",
      409,
    );
  }

  // Find latest published reactivation
  const latestPublished =
    await tx.eventReactivation.findFirst({
      where: {
        eventId,

        publishedAt: {
          not: null,
        },
      },

      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        id: true,
      },
    });

  if (latestPublished?.id !== reactivationId) {
    throw new EventServiceError(
      "Only the latest published reactivation can be managed",
      409,
    );
  }

  // Check latest reactivation request
  const latestRequest =
    await tx.eventReactivation.findFirst({
      where: {
        eventId,
      },

      orderBy: [
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],

      select: {
        id: true,
      },
    });

  if (latestRequest?.id !== reactivationId) {
    throw new EventServiceError(
      "A newer reactivation request already exists",
      409,
    );
  }

  return {
    event,
    reactivation,
  };
};

// ======================================================
// FINALIZE REACTIVATION STATUS
// ======================================================

export const finalizeReactivationStatus = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  reactivationId: string,
  now: Date,
) => {
  const dates = await tx.eventDate.findMany({
    where: {
      eventId,
      reactivationId,
    },

    select: {
      id: true,
      status: true,
      cancellationReason: true,
      cancelledAt: true,
    },
  });

  if (dates.length === 0) {
    throw new EventServiceError(
      "No published reactivation dates found",
      409,
    );
  }

  const remainingScheduledDates = dates.filter(
    (date) => date.status === "SCHEDULED",
  ).length;

  // Keep event active when dates remain
  if (remainingScheduledDates > 0) {
    return {
      isFinalized: false,
      remainingScheduledDates,
    };
  }

  // Check other scheduled dates of the parent event
  const otherScheduledDates =
    await tx.eventDate.count({
      where: {
        eventId,
        status: "SCHEDULED",

        OR: [
          {
            reactivationId: null,
          },
          {
            reactivationId: {
              not: reactivationId,
            },
          },
        ],
      },
    });

  if (otherScheduledDates > 0) {
    throw new EventServiceError(
      "Other scheduled event dates still exist",
      409,
    );
  }

  const hasCompletedDate = dates.some(
    (date) => date.status === "COMPLETED",
  );

  const hasExpiredDate = dates.some(
    (date) => date.status === "EXPIRED",
  );

  const finalStatus =
    hasCompletedDate
      ? "COMPLETED"
      : hasExpiredDate
        ? "EXPIRED"
        : "CANCELLED";

  const latestCancelledDate = dates
    .filter((date) => date.status === "CANCELLED")
    .sort(
      (a, b) =>
        (b.cancelledAt?.getTime() ?? 0) -
        (a.cancelledAt?.getTime() ?? 0),
    )[0];

  const cancellationReason =
    finalStatus === "CANCELLED"
      ? latestCancelledDate?.cancellationReason ?? null
      : null;

  // Update reactivation
  const updatedReactivation =
    await tx.eventReactivation.updateMany({
      where: {
        id: reactivationId,
        eventId,

        status: {
          in: ["PUBLISHED", "PAUSED"],
        },
      },

      data: {
        status: finalStatus,

        completedAt:
          finalStatus === "COMPLETED" ? now : null,

        expiredAt:
          finalStatus === "EXPIRED" ? now : null,

        cancelledAt:
          finalStatus === "CANCELLED" ? now : null,

        cancellationReason,
      },
    });

  if (updatedReactivation.count !== 1) {
    throw new EventServiceError(
      "Reactivation status changed. Please retry.",
      409,
    );
  }

  // Update parent event
  const updatedEvent = await tx.event.updateMany({
    where: {
      id: eventId,
      isDeleted: false,
      deletedAt: null,

      status: {
        in: ["PUBLISHED", "PAUSED"],
      },
    },

    data: {
      status: finalStatus,
      eventReactiveStatus: finalStatus,

      completedAt:
        finalStatus === "COMPLETED" ? now : null,

      expiredAt:
        finalStatus === "EXPIRED" ? now : null,

      cancelledAt:
        finalStatus === "CANCELLED" ? now : null,

      cancellationReason,
    },
  });

  if (updatedEvent.count !== 1) {
    throw new EventServiceError(
      "Event status changed. Please retry.",
      409,
    );
  }

  return {
    isFinalized: true,
    finalStatus,
    remainingScheduledDates: 0,
  };
};

// ======================================================
// REACTIVATION LIFECYCLE RESPONSE
// ======================================================

export const getReactivationLifecycleResult = async (
  tx: Prisma.TransactionClient,
  eventId: string,
  reactivationId: string,
) => {
  const event = await tx.event.findUniqueOrThrow({
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

      completedAt: true,

      cancelledAt: true,
      cancellationReason: true,

      expiredAt: true,
      reactivatedAt: true,
      updatedAt: true,
    },
  });

  const reactivation =
    await tx.eventReactivation.findUniqueOrThrow({
      where: {
        id: reactivationId,
      },

      select: {
        id: true,
        eventId: true,
        status: true,
        previousEventStatus: true,

        publishedAt: true,

        pausedAt: true,
        pauseReason: true,

        completedAt: true,

        cancelledAt: true,
        cancellationReason: true,

        expiredAt: true,
        updatedAt: true,

        publishedDates: {
          select: {
            id: true,
            startDateTime: true,
            endDateTime: true,
            timezone: true,
            status: true,
            completedAt: true,
            cancelledAt: true,
            cancellationReason: true,
            expiredAt: true,
          },

          orderBy: {
            startDateTime: "asc",
          },
        },
      },
    });

  return {
    eventId: event.id,
    title: event.title,

    status: event.status,
    eventReactiveStatus: event.eventReactiveStatus,

    reactivationId: reactivation.id,
    reactivationStatus: reactivation.status,

    pausedAt: reactivation.pausedAt,
    pauseReason: reactivation.pauseReason,

    completedAt: reactivation.completedAt,

    cancelledAt: reactivation.cancelledAt,
    cancellationReason: reactivation.cancellationReason,

    expiredAt: reactivation.expiredAt,

    publishedDates: reactivation.publishedDates,

    remainingScheduledDates:
      reactivation.publishedDates.filter(
        (date) => date.status === "SCHEDULED",
      ).length,

    updatedAt: reactivation.updatedAt,
  };
};