import {
  Prisma,
  EventReactiveStatus,
} from "@prisma/client";

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