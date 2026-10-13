
import { Request, Response } from "express";
import { z, ZodError } from "zod";
import { Prisma } from "@prisma/client";

import {
  conversationPromptService as service,
} from "./conversationPrompt.service";

import {
  uuidSchema,
  createCategorySchema,
  updateCategorySchema,
  createPromptSchema,
  updatePromptSchema,
  userPromptQuerySchema,
  adminPromptQuerySchema,
} from "./conversationPrompt.validation";

// ==========================================
// COMMON ERROR HANDLER
// ==========================================

const sendError = (
  res: Response,
  error: unknown
) => {
  console.error("CONVERSATION PROMPT ERROR:", error);

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    return res.status(400).json({
      success: false,
      message: "Database request failed",
    });
  }

  const message =
    error instanceof Error
      ? error.message
      : "Internal server error";

  const notFound = [
    "Category not found",
    "Prompt not found",
    "Record not found",
  ].includes(message);

  const conflict = [
    "Category slug already exists",
    "A record with this unique value already exists",
  ].includes(message);

  const clientError =
    notFound ||
    conflict ||
    message.startsWith("Cannot ") ||
    message === "Invalid related record";

  return res.status(
    notFound ? 404 : conflict ? 409 : clientError ? 400 : 500
  ).json({
    success: false,
    message: clientError
      ? message
      : "Internal server error",
  });
};

// ==========================================
// CATEGORY CONTROLLERS
// ==========================================

export const createCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const input = createCategorySchema.parse(req.body);

    const data = await service.createCategory(input);

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};



export const getCategoriesController = async (
  req: Request,
  res: Response
) => {
  try {
    const query = z.object({
      category: z.string().trim().min(1).optional(),
    }).parse(req.query);

    const data = await service.getCategories(
      query.category
    );

    return res.status(200).json({
      success: true,
      message: "Categories and prompts fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};



export const updateCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const input = updateCategorySchema.parse(req.body);

    const data = await service.updateCategory(id, input);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deleteCategoryController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = uuidSchema.parse(req.params.id);

    await service.deleteCategory(id);

    return res.status(200).json({
      success: true,
      message: "Category deactivated successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ==========================================
// PROMPT CONTROLLERS
// ==========================================

export const createPromptController = async (
  req: Request,
  res: Response
) => {
  try {
    const input = createPromptSchema.parse(req.body);

    const data = await service.createPrompt(input);

    return res.status(201).json({
      success: true,
      message: "Prompt created successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const updatePromptController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = uuidSchema.parse(req.params.id);
    const input = updatePromptSchema.parse(req.body);

    const data = await service.updatePrompt(id, input);

    return res.status(200).json({
      success: true,
      message: "Prompt updated successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export const deletePromptController = async (
  req: Request,
  res: Response
) => {
  try {
    const id = uuidSchema.parse(req.params.id);

    await service.deletePrompt(id);

    return res.status(200).json({
      success: true,
      message: "Prompt deactivated successfully",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ==========================================
// USER CONTROLLER
// ==========================================

export const getUserPromptsController = async (
  req: Request,
  res: Response
) => {
  try {
    const query = userPromptQuerySchema.parse(
      req.query
    );

    const data = await service.getUserPrompts(
      query.category
    );

    return res.status(200).json({
      success: true,
      message: "Conversation prompts fetched successfully",
      data,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// ==========================================
// ADMIN PROMPT LIST
// ==========================================

export const getAdminPromptsController = async (
  req: Request,
  res: Response
) => {
  try {
    const query = adminPromptQuerySchema.parse(
      req.query
    );

    const result = await service.getAdminPrompts(query);

    return res.status(200).json({
      success: true,
      message: "Prompts fetched successfully",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
