import { Request, Response } from "express";

import { ZodError } from "zod";

import {
  getUserEventsQuerySchema,
} from "./userEvent.validation";

import {
  getAllUserEventsService,
} from "./userEvent.service";

import {
  UserEventServiceError,
} from "./userEvent.types";

// ======================================================
// GET ALL PUBLISHED EVENTS FOR USER APP
// ======================================================

export const getAllUserEventsController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      "[USER EVENTS] Get all events request received"
    );

    // STEP 1 - Get authenticated user
    const userId = (
      req as Request & {
        user?: {
          userId?: string;
          id?: string;
        };
      }
    ).user;

    const authenticatedUserId =
      userId?.userId ?? userId?.id;

    if (!authenticatedUserId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // STEP 2 - Validate query
    const query = getUserEventsQuerySchema.parse(
      req.query
    );

    // STEP 3 - Fetch user events
    const result = await getAllUserEventsService(
      authenticatedUserId,
      query
    );

    console.log(
      "[USER EVENTS] Events fetched successfully",
      {
        userId: authenticatedUserId,
        packageType: result.packageType,
        visibility: result.visibility,
        total: result.pagination.total,
      }
    );

    // STEP 4 - Return response
    res.setHeader(
      "Cache-Control",
      "private, no-store"
    );

    return res.status(200).json({
      success: true,

      message: "Events fetched successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[USER EVENTS] Get all events error:",
      error
    );

    // VALIDATION ERROR
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,

        message: "Invalid request parameters",

        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // SERVICE ERROR
    if (error instanceof UserEventServiceError) {
      return res.status(error.statusCode).json({
        success: false,

        message: error.message,
      });
    }

    // INTERNAL SERVER ERROR
    return res.status(500).json({
      success: false,

      message: "Failed to fetch events",
    });
  }
};