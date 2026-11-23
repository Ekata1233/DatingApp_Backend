import { Request, Response } from "express";
import {
  EventDurationType,
  Prisma,
} from "@prisma/client";

import {
  createEventCategoryService,
  getAllEventCategoriesService,
  getEventCategoryByIdService,
  updateEventCategoryService,
  deleteEventCategoryService,
  CategoryServiceError,
} from "./event-category.service";

import {
  validateCategoryInput,
  CategoryValidationError,
} from "./event-category.validation";

import {
  CreateEventCategoryInput,
  UpdateEventCategoryInput,
} from "./event-category.types";

/* ==========================================================
   ERROR HANDLER
========================================================== */

const handleError = (
  error: unknown,
  res: Response
) => {
  if (
    error instanceof CategoryServiceError ||
    error instanceof CategoryValidationError
  ) {
    return res.status(
      error instanceof CategoryServiceError
        ? error.statusCode
        : 400
    ).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Category is referenced by another record",
      });
    }
  }

  console.error("Event Category Error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

/* ==========================================================
   CREATE
========================================================== */

export const createEventCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const data = validateCategoryInput(
      req.body
    ) as CreateEventCategoryInput;

    const category = await createEventCategoryService(data);

    return res.status(201).json({
      success: true,
      message: "Event category created successfully",
      data: category,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/* ==========================================================
   GET ALL
========================================================== */

export const getAllEventCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const rawPage = req.query.page ?? "1";
    const rawLimit = req.query.limit ?? "20";

    const page = Number(rawPage);
    const limit = Number(rawLimit);

    if (
      !Number.isInteger(page) ||
      page < 1 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters",
      });
    }

    const search =
      typeof req.query.search === "string"
        ? req.query.search.trim()
        : undefined;

    if (search && search.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search must not exceed 100 characters",
      });
    }

    const duration = req.query.eventDurationType;

    if (
      duration !== undefined &&
      !Object.values(EventDurationType).includes(
        duration as EventDurationType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid eventDurationType",
      });
    }

    const activeQuery = req.query.isActive;

    if (
      activeQuery !== undefined &&
      activeQuery !== "true" &&
      activeQuery !== "false"
    ) {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const result = await getAllEventCategoriesService({
      page,
      limit,
      search,
      eventDurationType:
        duration as EventDurationType | undefined,
      isActive:
        activeQuery === undefined
          ? undefined
          : activeQuery === "true",
    });

    return res.status(200).json({
      success: true,
      message: "Event categories fetched successfully",
      data: result.categories,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/* ==========================================================
   GET BY ID
========================================================== */

export const getEventCategoryByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const categoryId = String(req.params.categoryId);

    const category = await getEventCategoryByIdService(
      categoryId
    );

    return res.status(200).json({
      success: true,
      message: "Event category fetched successfully",
      data: category,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/* ==========================================================
   UPDATE
========================================================== */

export const updateEventCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const categoryId = String(req.params.categoryId);

    const data = validateCategoryInput(
      req.body,
      true
    ) as UpdateEventCategoryInput;

    const category = await updateEventCategoryService(
      categoryId,
      data
    );

    return res.status(200).json({
      success: true,
      message: "Event category updated successfully",
      data: category,
    });
  } catch (error) {
    return handleError(error, res);
  }
};

/* ==========================================================
   DELETE
========================================================== */

export const deleteEventCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const categoryId = String(req.params.categoryId);

    const result = await deleteEventCategoryService(
      categoryId
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return handleError(error, res);
  }
};