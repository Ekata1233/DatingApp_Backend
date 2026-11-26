import { Request, Response } from "express";

import { ZodError } from "zod";

import {
    adminEventIdSchema,
  getAllAdminEventsQuerySchema,
  reviewAdminEventSchema,
} from "./adminEvent.validation";

import {
    AdminEventServiceError,
  getAllAdminEventsService,
  reviewAdminEventService,
} from "./adminEvent.service";
import { Prisma } from "@prisma/client";

// ======================================================
// GET ALL ADMIN EVENTS
// ======================================================

export const getAllAdminEventsController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      "[ADMIN EVENTS] Get all events request received"
    );

    // STEP 1 - Validate pagination
    const query = getAllAdminEventsQuerySchema.parse(
      req.query
    );

    // STEP 2 - Fetch all events
    const result = await getAllAdminEventsService(query);

    console.log(
      "[ADMIN EVENTS] Events fetched successfully",
      {
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
      }
    );

    // STEP 3 - Return response
    return res.status(200).json({
      success: true,

      message: "Events list fetched successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[ADMIN EVENTS] Get all events error:",
      error
    );

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

    return res.status(500).json({
      success: false,

      message: "Failed to fetch events list",
    });
  }
};

// ======================================================
// ADMIN APPROVE / REJECT EVENT
// ======================================================

export const reviewAdminEventController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      "[ADMIN EVENT REVIEW] Request received"
    );

    // STEP 1 - Validate event ID
    const eventId = adminEventIdSchema.parse(
      req.params.eventId
    );

    // STEP 2 - Validate request body
    const input = reviewAdminEventSchema.parse(
      req.body
    );

    console.log(
      "[ADMIN EVENT REVIEW] Event ID:",
      eventId
    );

    console.log(
      "[ADMIN EVENT REVIEW] Requested status:",
      input.status
    );

    // STEP 3 - Review event
    const event = await reviewAdminEventService(
      eventId,
      input
    );

    // STEP 4 - Prepare success message
    const message =
      event.status === "APPROVED"
        ? "Event approved successfully"
        : "Event rejected successfully";

    console.log(
      "[ADMIN EVENT REVIEW] Review completed",
      {
        eventId: event.id,
        status: event.status,
        approvedAt: event.approvedAt,
      }
    );

    // STEP 5 - Return response
    return res.status(200).json({
      success: true,

      message,

      data: {
        eventId: event.id,

        title: event.title,

        eventDurationType: event.eventDurationType,

        tripType: event.tripType,

        status: event.status,

        submittedAt: event.submittedAt,

        approvedAt: event.approvedAt,

        publishedAt: event.publishedAt,

        rejectionReason: event.rejectionReason,

        updatedAt: event.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "[ADMIN EVENT REVIEW] Error:",
      error
    );

    // ZOD VALIDATION ERROR
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,

        message: "Invalid event review request",

        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    // SERVICE ERROR
    if (error instanceof AdminEventServiceError) {
      return res.status(error.statusCode).json({
        success: false,

        message: error.message,
      });
    }

    // PRISMA CONCURRENT TRANSACTION ERROR
    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2034"
    ) {
      return res.status(409).json({
        success: false,

        message:
          "Event status has changed. Please refresh and try again.",
      });
    }

    // INTERNAL SERVER ERROR
    return res.status(500).json({
      success: false,

      message: "Failed to review event",
    });
  }
};