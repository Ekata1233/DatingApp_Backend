import { Prisma } from "@prisma/client";

import { prisma } from "../../../prisma/prismaClient";

import {
  GetReactivationQuery,
} from "./event.reactivation.types";

export const reactivationInclude = {
  event: {
    select: {
      id: true,
      title: true,
      eventDurationType: true,
      tripType: true,
      status: true,
      eventReactiveStatus: true,
      businessDetailsId: true,
    },
  },

  dates: {
    orderBy: {
      startDateTime: "asc",
    },
  },

  publishedDates: {
    orderBy: {
      startDateTime: "asc",
    },
  },
} satisfies Prisma.EventReactivationInclude;

// ======================================================
// FIND ORGANIZER'S REACTIVATION
// ======================================================

export const findOwnedReactivation = async (
  tx: Prisma.TransactionClient,
  businessId: string,
  eventId: string,
  reactivationId: string
) => {
  return tx.eventReactivation.findFirst({
    where: {
      id: reactivationId,
      eventId,

      event: {
        is: {
          businessDetailsId: businessId,
          isDeleted: false,
          deletedAt: null,
        },
      },
    },

    include: reactivationInclude,
  });
};

// ======================================================
// GET REACTIVATION HISTORY
// ======================================================

export const findAllReactivations = async (
  businessId: string,
  eventId: string,
  query: GetReactivationQuery
) => {
  const { page, limit } = query;

  const where: Prisma.EventReactivationWhereInput = {
    eventId,

    event: {
      is: {
        businessDetailsId: businessId,
        isDeleted: false,
        deletedAt: null,
      },
    },
  };

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