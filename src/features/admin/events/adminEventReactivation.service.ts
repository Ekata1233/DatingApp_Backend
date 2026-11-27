import { Prisma } from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import {
  EventServiceError,
} from "../../event-partner/events/event.types";

import {
  reactivationInclude,
} from "../../event-partner/events/event.reactivation.repository";

import {
  AdminReactivationQuery,
  ReviewReactivationInput,
} from "./adminEventReactivation.validation";

// ======================================================
// GET ALL REACTIVATION REQUESTS
// ======================================================

export const getAllAdminReactivationsService = async (
  query: AdminReactivationQuery
) => {
  const { page, limit, status, eventId } = query;

  const where: Prisma.EventReactivationWhereInput = {
    event: {
      is: {
        isDeleted: false,
        deletedAt: null,
      },
    },
  };

  if (status) {
    where.status = status;
  } else {
    // Do not expose unsubmitted organizer drafts.

    where.status = {
      not: "DRAFT",
    };
  }

  if (eventId) {
    where.eventId = eventId;
  }

  const [items, total] = await prisma.$transaction([
    prisma.eventReactivation.findMany({
      where,

      include: reactivationInclude,

      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],

      skip: (page - 1) * limit,

      take: limit,
    }),

    prisma.eventReactivation.count({
      where,
    }),
  ]);

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

// ======================================================
// GET SINGLE REACTIVATION
// ======================================================

export const getAdminReactivationByIdService = async (
  reactivationId: string
) => {
  const result =
    await prisma.eventReactivation.findFirst({
      where: {
        id: reactivationId,

        status: {
          not: "DRAFT",
        },

        event: {
          is: {
            isDeleted: false,
            deletedAt: null,
          },
        },
      },

      include: reactivationInclude,
    });

  if (!result) {
    throw new EventServiceError(
      "Reactivation request not found",
      404
    );
  }

  return result;
};

// ======================================================
// REVIEW / APPROVE / REJECT REACTIVATION
// ======================================================

export const reviewReactivationService = async (
  reactivationId: string,
  input: ReviewReactivationInput
) => {
  return prisma.$transaction(
    async (tx) => {
      const now = new Date();

      const reactivation =
        await tx.eventReactivation.findFirst({
          where: {
            id: reactivationId,

            event: {
              is: {
                isDeleted: false,
                deletedAt: null,
              },
            },
          },

          include: {
            dates: true,

            event: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        });

      if (!reactivation) {
        throw new EventServiceError(
          "Reactivation request not found",
          404
        );
      }

      if (
        reactivation.status !== "SUBMITTED" &&
        reactivation.status !== "UNDER_REVIEW"
      ) {
        throw new EventServiceError(
          "Only submitted or under-review requests can be reviewed",
          409
        );
      }

      if (
        input.status === "UNDER_REVIEW" &&
        reactivation.status === "UNDER_REVIEW"
      ) {
        throw new EventServiceError(
          "Request is already under review",
          409
        );
      }

      let updateData:
        Prisma.EventReactivationUpdateManyMutationInput;

      // UNDER REVIEW

      if (input.status === "UNDER_REVIEW") {
        updateData = {
          status: "UNDER_REVIEW",
          reviewedAt: now,
        };
      }

      // APPROVE

      // APPROVE

else if (input.status === "APPROVED") {

  // 1. Validate main event status

  if (
    reactivation.event.status !== "PUBLISHED" &&
    reactivation.event.status !== "COMPLETED" &&
    reactivation.event.status !== "EXPIRED" &&
    reactivation.event.status !== "PAUSED" &&
    reactivation.event.status !== "CANCELLED"
  ) {
    throw new EventServiceError(
      "Original event is no longer eligible for reactivation",
      409
    );
  }

  // 2. Validate existing event date status

  const eligibleEventDate = await tx.eventDate.findFirst({
    where: {
      eventId: reactivation.eventId,

      status: {
        in: [
          "CANCELLED",
          "COMPLETED",
          "EXPIRED",
        ],
      },
    },

    select: {
      id: true,
      status: true,
    },
  });

  if (!eligibleEventDate) {
    throw new EventServiceError(
      "Only cancelled, completed or expired event dates can be reactivated",
      409
    );
  }

  // 3. Validate proposed reactivation dates

  if (reactivation.dates.length === 0) {
    throw new EventServiceError(
      "Reactivation dates are missing",
      400
    );
  }

  const invalidDate = reactivation.dates.some(
    (date) =>
      date.startDateTime <= now ||
      date.endDateTime <= date.startDateTime
  );

  if (invalidDate) {
    throw new EventServiceError(
      "Proposed dates have expired or are invalid. Reject the request and ask the organizer to update them.",
      400
    );
  }

  // 4. Prevent duplicate dates

  const duplicateDate = await tx.eventDate.findFirst({
    where: {
      eventId: reactivation.eventId,

      startDateTime: {
        in: reactivation.dates.map(
          (date) => date.startDateTime
        ),
      },
    },

    select: {
      id: true,
    },
  });

  if (duplicateDate) {
    throw new EventServiceError(
      "One of the proposed dates already exists for this event",
      409
    );
  }

  // 5. Prevent overlap with existing scheduled dates

  for (const date of reactivation.dates) {
    const overlappingDate = await tx.eventDate.findFirst({
      where: {
        eventId: reactivation.eventId,

        status: "SCHEDULED",

        startDateTime: {
          lt: date.endDateTime,
        },

        OR: [
          {
            endDateTime: {
              gt: date.startDateTime,
            },
          },
          {
            endDateTime: null,

            startDateTime: {
              gte: date.startDateTime,
            },
          },
        ],
      },

      select: {
        id: true,
        startDateTime: true,
        endDateTime: true,
      },
    });

    if (overlappingDate) {
      throw new EventServiceError(
        "Proposed date overlaps with an existing scheduled event date",
        409
      );
    }
  }

  // 6. Approve reactivation request

  updateData = {
    status: "APPROVED",
    reviewedAt: now,
    approvedAt: now,
    rejectedAt: null,
    rejectionReason: null,
  };
}

      // REJECT

      else {
        updateData = {
          status: "REJECTED",
          reviewedAt: now,
          rejectedAt: now,
          approvedAt: null,
          rejectionReason: input.rejectionReason,
        };
      }

      const updated =
        await tx.eventReactivation.updateMany({
          where: {
            id: reactivationId,

            status: {
              in: ["SUBMITTED", "UNDER_REVIEW"],
            },
          },

          data: updateData,
        });

      if (updated.count !== 1) {
        throw new EventServiceError(
          "Request status changed. Please retry.",
          409
        );
      }

      // Update only reactivation status.
      // Original Event.status remains unchanged.

      await tx.event.update({
        where: {
          id: reactivation.eventId,
        },

        data: {
          eventReactiveStatus: input.status,
        },
      });

      return tx.eventReactivation.findUniqueOrThrow({
        where: {
          id: reactivationId,
        },

        include: reactivationInclude,
      });
    },

    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,

      maxWait: 5000,

      timeout: 15000,
    }
  );
};