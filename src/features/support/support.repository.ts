import {
  CallbackStatus,
  Prisma,
} from "@prisma/client";



import {
  CreateFaqDto,
  UpdateFaqDto,
} from "./support.types";
import { prisma } from "../../prisma/prismaClient";

/* =========================================================
   CALLBACK
========================================================= */

export const createCallbackRepository = async (
  data: Prisma.CallbackRequestUncheckedCreateInput,
) => {
  return prisma.callbackRequest.create({
    data,
  });
};

export const getUserCallbackHistoryRepository = async (
  userId: string,
) => {
  return prisma.callbackRequest.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const findCallbackByIdRepository = async (
  callbackId: string,
) => {
  return prisma.callbackRequest.findUnique({
    where: {
      id: callbackId,
    },
  });
};

export const findUserCallbackByIdRepository = async (
  callbackId: string,
  userId: string,
) => {
  return prisma.callbackRequest.findFirst({
    where: {
      id: callbackId,
      userId,
    },
  });
};

export const cancelCallbackRepository = async (
  callbackId: string,
) => {
  return prisma.callbackRequest.update({
    where: {
      id: callbackId,
    },

    data: {
      status: CallbackStatus.CANCELLED,
      cancelledAt: new Date(),
    },
  });
};

/* =========================================================
   ADMIN CALLBACK
========================================================= */

export const getAdminCallbacksRepository = async (
  where: Prisma.CallbackRequestWhereInput,
  skip: number,
  take: number,
) => {
  return prisma.callbackRequest.findMany({
    where,

    select: {
      id: true,
      callbackNumber: true,

      callbackDate: true,
      timeWindow: true,
      topic: true,
      status: true,

      agentName: true,
      callDuration: true,
      resolutionNote: true,

      resolvedAt: true,
      missedAt: true,
      cancelledAt: true,

      createdAt: true,
      updatedAt: true,

      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,

          photos: {
            select: {
              id: true,
              media_url: true,
            },

            orderBy: {
              created_at: "asc",
            },

            take: 1,
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    skip,
    take,
  });
};

export const countAdminCallbacksRepository = async (
  where: Prisma.CallbackRequestWhereInput,
) => {
  return prisma.callbackRequest.count({
    where,
  });
};

export const getAdminCallbackByIdRepository = async (
  callbackId: string,
) => {
  return prisma.callbackRequest.findUnique({
    where: {
      id: callbackId,
    },

    select: {
      id: true,
      callbackNumber: true,

      callbackDate: true,
      timeWindow: true,
      topic: true,
      status: true,

      agentName: true,
      callDuration: true,
      resolutionNote: true,

      resolvedAt: true,
      missedAt: true,
      cancelledAt: true,

      createdAt: true,
      updatedAt: true,

      user: {
        select: {
          id: true,
          full_name: true,
          email: true,
          phone_number: true,

          photos: {
            select: {
              id: true,
              media_url: true,
            },

            orderBy: {
              created_at: "asc",
            },

            take: 1,
          },
        },
      },
    },
  });
};

export const updateCallbackStatusRepository = async (
  callbackId: string,
  data: Prisma.CallbackRequestUpdateInput,
) => {
  return prisma.callbackRequest.update({
    where: {
      id: callbackId,
    },

    data,
  });
};

/* =========================================================
   FAQ USER
========================================================= */

export const getActiveFaqsRepository = async () => {
  return prisma.supportFaq.findMany({
    where: {
      isActive: true,
    },

    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });
};

/* =========================================================
   FAQ ADMIN
========================================================= */

export const createFaqRepository = async (
  data: CreateFaqDto,
) => {
  return prisma.supportFaq.create({
    data: {
      question: data.question,
      answer: data.answer,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    },
  });
};

export const getAdminFaqsRepository = async () => {
  return prisma.supportFaq.findMany({
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });
};

export const getFaqByIdRepository = async (
  faqId: string,
) => {
  return prisma.supportFaq.findUnique({
    where: {
      id: faqId,
    },
  });
};

export const updateFaqRepository = async (
  faqId: string,
  data: UpdateFaqDto,
) => {
  return prisma.supportFaq.update({
    where: {
      id: faqId,
    },

    data,
  });
};

export const deleteFaqRepository = async (
  faqId: string,
) => {
  return prisma.supportFaq.delete({
    where: {
      id: faqId,
    },
  });
};

export const findCallbackByNumberRepository = async (
  callbackNumber: string,
) => {
  return prisma.callbackRequest.findUnique({
    where: {
      callbackNumber,
    },

    select: {
      id: true,
    },
  });
};