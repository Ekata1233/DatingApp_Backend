import { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

import {
  calculateEventCheckoutSchema,
  checkoutEventIdSchema,
  getUserEventsQuerySchema,
} from "./userEvent.validation";

import {
  calculateEventCheckout,
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
  res: Response,
) => {
  try {
    console.log(
      "[USER EVENTS] Get all events request received",
    );

    // STEP 1 - Get optional authenticated user

    const user = (
      req as Request & {
        user?: {
          userId?: string;
          id?: string;
        };
      }
    ).user;

    const authenticatedUserId =
      user?.userId ?? user?.id ?? null;

    console.log("[USER EVENTS] Request user:", {
      userId: authenticatedUserId,
      isAuthenticated: !!authenticatedUserId,
    });

    // STEP 2 - Validate query

    const query = getUserEventsQuerySchema.parse(
      req.query,
    );

    // STEP 3 - Fetch events

    const result = await getAllUserEventsService(
      authenticatedUserId,
      query,
    );

    console.log(
      "[USER EVENTS] Events fetched successfully",
      {
        userId: authenticatedUserId,
        isAuthenticated: !!authenticatedUserId,
        packageType: result.packageType,
        visibility: result.visibility,
        total: result.pagination.total,
      },
    );

    // STEP 4 - Return response

    res.setHeader(
      "Cache-Control",
      "private, no-store",
    );

    return res.status(200).json({
      success: true,

      message: "Events fetched successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[USER EVENTS] Get all events error:",
      error,
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


// ======================================================
// CALCULATE EVENT CHECKOUT CONTROLLER
// ======================================================

export const calculateEventCheckoutController =
  async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      console.log(
        "[EVENT CHECKOUT] Request received",
      );

      // STEP 1 - Get authenticated user

      const userId = (
        req as Request & {
          user?: {
            id: string;
          };
        }
      ).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized user",
        });
      }

      // STEP 2 - Validate event ID

      const eventId =
        checkoutEventIdSchema.parse(
          req.params.eventId,
        );

      // STEP 3 - Validate request body

      const {
        eventDateId,
        tickets,
        couponCode,
      } = calculateEventCheckoutSchema.parse(
        req.body,
      );

      console.log("[EVENT CHECKOUT] Details", {
        userId,
        eventId,
        eventDateId,
        tickets,
      });

      // STEP 4 - Calculate checkout

      const data = await calculateEventCheckout(
  eventId,
  eventDateId,
  userId,
  tickets,
  couponCode,
);

      // STEP 5 - Return response

      return res.status(200).json({
        success: true,

        message:
          "Event checkout calculated successfully",

        data,
      });

    } catch (error: any) {
      console.error(
        "[EVENT CHECKOUT] Error:",
        error,
      );
if (error instanceof ZodError) {
  return res.status(400).json({
    success: false,
    message: "Validation failed",

    errors: error.issues.map(
      (issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }),
    ),
  });
}

      return res.status(400).json({
        success: false,

        message:
          error?.message ||
          "Failed to calculate checkout",
      });
    }
  };