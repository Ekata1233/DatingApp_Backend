import {
  CallbackRequest,
  CallbackStatus,
  Prisma,
} from "@prisma/client";


import {
  CreateCallbackDto,
  CreateFaqDto,
  UpdateCallbackStatusDto,
  UpdateFaqDto,
} from "./support.types";
import { cancelCallbackRepository, countAdminCallbacksRepository, createCallbackRepository, createFaqRepository, deleteFaqRepository, findCallbackByIdRepository, findCallbackByNumberRepository, findUserCallbackByIdRepository, getActiveFaqsRepository, getAdminCallbackByIdRepository, getAdminCallbacksRepository, getAdminFaqsRepository, getFaqByIdRepository, getUserCallbackHistoryRepository, updateCallbackStatusRepository, updateFaqRepository } from "./support.repository";

/* =========================================================
   CALLBACK NUMBER
========================================================= */

const generateCallbackNumber = () => {
  const randomNumber = Math.floor(
    100000 + Math.random() * 900000,
  );

  return `CB-${randomNumber}`;
};

/*
  Because callbackNumber has @unique,
  technically a 6-digit random number can collide.

  So we check before using it.
*/



const generateUniqueCallbackNumber = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const callbackNumber = generateCallbackNumber();

    const existing =
      await findCallbackByNumberRepository(
        callbackNumber,
      );

    if (!existing) {
      return callbackNumber;
    }
  }

  throw new Error(
    "Unable to generate callback number",
  );
};

/* =========================================================
   CREATE CALLBACK
========================================================= */

export const createCallbackService = async (
  userId: string,
  payload: CreateCallbackDto,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const callbackDate = new Date(
    `${payload.callbackDate}T00:00:00.000Z`,
  );

  if (Number.isNaN(callbackDate.getTime())) {
    throw new Error("Invalid callback date");
  }

  /*
   * Do not allow past date
   */

  const today = new Date();

  const todayDateOnly = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );

  if (callbackDate < todayDateOnly) {
    throw new Error("Callback date cannot be in the past");
  }

  const callbackNumber =
    await generateUniqueCallbackNumber();

  return createCallbackRepository({
    userId,

    callbackNumber,

    callbackDate,

    timeWindow: payload.timeWindow.trim(),

    topic: payload.topic?.trim() || null,

    status: CallbackStatus.REQUESTED,
  });
};

/* =========================================================
   USER CALLBACK HISTORY
========================================================= */

export const getUserCallbackHistoryService = async (
  userId: string,
) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const callbacks =
    await getUserCallbackHistoryRepository(userId);

  return {
    count: callbacks.length,

  callbacks: callbacks.map((callback: CallbackRequest) => ({
  id: callback.id,

      callbackNumber: callback.callbackNumber,

      topic: callback.topic,

      callbackDate: callback.callbackDate,

      timeWindow: callback.timeWindow,

      status: callback.status,

      agentName: callback.agentName,

      callDuration: callback.callDuration,

      resolutionNote: callback.resolutionNote,

      resolvedAt: callback.resolvedAt,
      missedAt: callback.missedAt,
      cancelledAt: callback.cancelledAt,

      createdAt: callback.createdAt,
    })),
  };
};

/* =========================================================
   USER CANCEL CALLBACK
========================================================= */

export const cancelCallbackService = async (
  userId: string,
  callbackId: string,
) => {
  if (!callbackId) {
    throw new Error("Callback ID is required");
  }

  const callback =
    await findUserCallbackByIdRepository(
      callbackId,
      userId,
    );

  if (!callback) {
    throw new Error("Callback request not found");
  }

  if (
    callback.status === CallbackStatus.RESOLVED ||
    callback.status === CallbackStatus.MISSED ||
    callback.status === CallbackStatus.CANCELLED
  ) {
    throw new Error(
      `Cannot cancel callback with status ${callback.status}`,
    );
  }

  return cancelCallbackRepository(callbackId);
};

/* =========================================================
   ADMIN CALLBACK LIST
========================================================= */

interface GetAdminCallbacksParams {
  page?: number;
  limit?: number;
  status?: CallbackStatus;
  search?: string;
}

export const getAdminCallbacksService = async ({
  page = 1,
  limit = 20,
  status,
  search,
}: GetAdminCallbacksParams) => {
  if (page < 1) {
    page = 1;
  }

  if (limit < 1) {
    limit = 20;
  }

  if (limit > 100) {
    limit = 100;
  }

  const skip = (page - 1) * limit;

  const where: Prisma.CallbackRequestWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (search?.trim()) {
    const value = search.trim();

    where.OR = [
      {
        callbackNumber: {
          contains: value,
          mode: "insensitive",
        },
      },

      {
        topic: {
          contains: value,
          mode: "insensitive",
        },
      },

      {
        user: {
          full_name: {
            contains: value,
            mode: "insensitive",
          },
        },
      },

      {
        user: {
          phone_number: {
            contains: value,
          },
        },
      },
    ];
  }

  const [callbacks, total] = await Promise.all([
    getAdminCallbacksRepository(
      where,
      skip,
      limit,
    ),

    countAdminCallbacksRepository(where),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),

    data: callbacks.map((callback) => ({
      ...callback,

      user: {
        ...callback.user,

        profilePhoto:
          callback.user.photos[0]?.media_url ?? null,

        photos: undefined,
      },
    })),
  };
};

/* =========================================================
   ADMIN CALLBACK DETAIL
========================================================= */

export const getAdminCallbackByIdService = async (
  callbackId: string,
) => {
  const callback =
    await getAdminCallbackByIdRepository(callbackId);

  if (!callback) {
    throw new Error("Callback request not found");
  }

  return {
    ...callback,

    user: {
      ...callback.user,

      profilePhoto:
        callback.user.photos[0]?.media_url ?? null,

      photos: undefined,
    },
  };
};

/* =========================================================
   ADMIN UPDATE CALLBACK
========================================================= */

export const updateCallbackStatusService = async (
  callbackId: string,
  payload: UpdateCallbackStatusDto,
) => {
  const callback =
    await findCallbackByIdRepository(callbackId);

  if (!callback) {
    throw new Error("Callback request not found");
  }

  const data: Prisma.CallbackRequestUpdateInput = {
    status: payload.status,
  };

  if (payload.agentName !== undefined) {
    data.agentName = payload.agentName;
  }

  if (payload.callDuration !== undefined) {
    data.callDuration = payload.callDuration;
  }

  if (payload.resolutionNote !== undefined) {
    data.resolutionNote = payload.resolutionNote;
  }

  /*
   * Handle status timestamps automatically
   */

  if (payload.status === CallbackStatus.RESOLVED) {
    data.resolvedAt = new Date();

    data.missedAt = null;
    data.cancelledAt = null;
  }

  if (payload.status === CallbackStatus.MISSED) {
    data.missedAt = new Date();

    data.resolvedAt = null;
    data.cancelledAt = null;
  }

  if (payload.status === CallbackStatus.CANCELLED) {
    data.cancelledAt = new Date();

    data.resolvedAt = null;
    data.missedAt = null;
  }

  if (
    payload.status === CallbackStatus.REQUESTED ||
    payload.status === CallbackStatus.SCHEDULED
  ) {
    data.resolvedAt = null;
    data.missedAt = null;
    data.cancelledAt = null;
  }

  return updateCallbackStatusRepository(
    callbackId,
    data,
  );
};

/* =========================================================
   USER FAQ
========================================================= */

export const getFaqsService = async () => {
  return getActiveFaqsRepository();
};

/* =========================================================
   ADMIN CREATE FAQ
========================================================= */

export const createFaqService = async (
  payload: CreateFaqDto,
) => {
  return createFaqRepository({
    question: payload.question.trim(),
    answer: payload.answer.trim(),
    isActive: payload.isActive,
    sortOrder: payload.sortOrder,
  });
};

/* =========================================================
   ADMIN FAQ LIST
========================================================= */

export const getAdminFaqsService = async () => {
  return getAdminFaqsRepository();
};

/* =========================================================
   ADMIN UPDATE FAQ
========================================================= */

export const updateFaqService = async (
  faqId: string,
  payload: UpdateFaqDto,
) => {
  const faq = await getFaqByIdRepository(faqId);

  if (!faq) {
    throw new Error("FAQ not found");
  }

  return updateFaqRepository(faqId, {
    ...(payload.question !== undefined && {
      question: payload.question.trim(),
    }),

    ...(payload.answer !== undefined && {
      answer: payload.answer.trim(),
    }),

    ...(payload.isActive !== undefined && {
      isActive: payload.isActive,
    }),

    ...(payload.sortOrder !== undefined && {
      sortOrder: payload.sortOrder,
    }),
  });
};

/* =========================================================
   ADMIN DELETE FAQ
========================================================= */

export const deleteFaqService = async (
  faqId: string,
) => {
  const faq = await getFaqByIdRepository(faqId);

  if (!faq) {
    throw new Error("FAQ not found");
  }

  await deleteFaqRepository(faqId);

  return {
    id: faqId,
  };
};