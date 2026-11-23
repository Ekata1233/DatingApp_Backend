import {
  EventDurationType,
  Prisma,
} from "@prisma/client";



import {
  CreateEventCategoryInput,
  UpdateEventCategoryInput,
} from "./event-category.types";
import { prisma } from "../../../prisma/prismaClient";

export class CategoryServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "CategoryServiceError";
  }
}

/* ==========================================================
   CREATE CATEGORY
========================================================== */

export const createEventCategoryService = async (
  data: CreateEventCategoryInput
) => {
  const existing = await prisma.eventCategory.findUnique({
    where: {
      value_eventDurationType: {
        value: data.value,
        eventDurationType: data.eventDurationType,
      },
    },
  });

  if (existing) {
    throw new CategoryServiceError(
      "Category already exists for this event duration type",
      409
    );
  }

  return prisma.eventCategory.create({
    data: {
      label: data.label,
      value: data.value,
      eventDurationType: data.eventDurationType,
      icon: data.icon ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    },
  });
};

/* ==========================================================
   GET ALL CATEGORIES
========================================================== */

interface GetCategoriesParams {
  page: number;
  limit: number;
  search?: string;
  eventDurationType?: EventDurationType;
  isActive?: boolean;
}

export const getAllEventCategoriesService = async ({
  page,
  limit,
  search,
  eventDurationType,
  isActive,
}: GetCategoriesParams) => {
  const skip = (page - 1) * limit;

  const where: Prisma.EventCategoryWhereInput = {};

  if (search) {
    where.OR = [
      {
        label: {
          contains: search,
          mode: "insensitive",
        },
      },
      {
        value: {
          contains: search,
          mode: "insensitive",
        },
      },
    ];
  }

  if (eventDurationType) {
    // BOTH categories are also applicable to the selected duration.
    where.eventDurationType =
      eventDurationType === EventDurationType.BOTH
        ? EventDurationType.BOTH
        : {
            in: [
              eventDurationType,
              EventDurationType.BOTH,
            ],
          };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [categories, total] = await prisma.$transaction([
    prisma.eventCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "desc" },
      ],
    }),

    prisma.eventCategory.count({ where }),
  ]);

  return {
    categories,
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

/* ==========================================================
   GET CATEGORY BY ID
========================================================== */

export const getEventCategoryByIdService = async (
  categoryId: string
) => {
  const category = await prisma.eventCategory.findUnique({
    where: {
      id: categoryId,
    },
  });

  if (!category) {
    throw new CategoryServiceError(
      "Event category not found",
      404
    );
  }

  return category;
};

/* ==========================================================
   UPDATE CATEGORY
========================================================== */

export const updateEventCategoryService = async (
  categoryId: string,
  data: UpdateEventCategoryInput
) => {
  const existing = await getEventCategoryByIdService(
    categoryId
  );

  const value = data.value ?? existing.value;

  const eventDurationType =
    data.eventDurationType ??
    existing.eventDurationType;

  const duplicate = await prisma.eventCategory.findUnique({
    where: {
      value_eventDurationType: {
        value,
        eventDurationType,
      },
    },
  });

  if (duplicate && duplicate.id !== categoryId) {
    throw new CategoryServiceError(
      "Another category already exists with this value and duration",
      409
    );
  }

  return prisma.eventCategory.update({
    where: {
      id: categoryId,
    },
    data,
  });
};

/* ==========================================================
   DELETE CATEGORY
========================================================== */

export const deleteEventCategoryService = async (
  categoryId: string
) => {
  await getEventCategoryByIdService(categoryId);

  // Prevent deleting categories assigned to existing events.
  const usedCount = await prisma.yourEvents.count({
    where: {
      categoryId,
    },
  });

  if (usedCount > 0) {
    throw new CategoryServiceError(
      "Cannot delete this category because it is used by existing events. Deactivate it instead.",
      409
    );
  }

  await prisma.eventCategory.delete({
    where: {
      id: categoryId,
    },
  });

  return {
    message: "Event category deleted successfully",
  };
};