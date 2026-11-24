
import {
  Request,
  Response,
} from "express";

import { Prisma } from "@prisma/client";

import { ZodError } from "zod";

import {
  saveEventSchema,
  getEventsQuerySchema,
  eventIdSchema,
} from "./event.validation";

import {
  saveEventService,
  getAllEventsService,
  getEventByIdService,
  deleteEventService,
} from "./event.service";

import {
  OrganizerContext,
  EventServiceError,
} from "./event.types";

// ================= NEW IMAGEKIT IMPORT =================

import {
  parseEventPayload,
  prepareEventImages,
  cleanupEventImages,
} from "./event.imagekit";

// ======================================================
// GET AUTHENTICATED ORGANIZER
// ======================================================

const getOrganizer = (
  req: Request
): OrganizerContext => {
  const partner = (
    req as Request & {
      partner?: OrganizerContext;
    }
  ).partner;

  if (!partner?.id) {
    throw new EventServiceError(
      "Unauthorized organizer",
      401
    );
  }

  if (partner.role !== "ORGANIZER") {
    throw new EventServiceError(
      "Only organizers can manage events",
      403
    );
  }

  if (!partner.businessId) {
    throw new EventServiceError(
      "Organizer business details not found",
      403
    );
  }

  return partner;
};

// ======================================================
// COMMON ERROR HANDLER
// ======================================================

const handleEventError = (
  error: unknown,
  res: Response
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",

      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error instanceof EventServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate event data",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message:
          "Operation conflicts with related event records",
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Event record not found",
      });
    }

    if (error.code === "P2034") {
      return res.status(409).json({
        success: false,
        message:
          "Concurrent event update detected. Please retry.",
      });
    }
  }

  console.error("Event API Error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// ======================================================
// PATCH - CREATE OR UPDATE EVENT WITH IMAGEKIT
// ======================================================

export const saveEventController = async (
  req: Request,
  res: Response
) => {
  let uploadedFileIds: string[] = [];
  let databaseSaved = false;
  let databaseStarted = false;

  try {
    // ================= AUTHENTICATION =================

    const organizer = getOrganizer(req);

    // ================= PARSE REQUEST =================

    const payload = parseEventPayload(req);

    // ================= UPDATE OWNERSHIP CHECK =================

    if (payload.eventId !== undefined) {
      const eventId = eventIdSchema.parse(
        payload.eventId
      );

      const existingEvent =
        await getEventByIdService(
          organizer.businessId,
          eventId
        );

      if (
        existingEvent.status !== "DRAFT" &&
        existingEvent.status !== "REJECTED"
      ) {
        throw new EventServiceError(
          "Only draft or rejected events can be updated",
          409
        );
      }
    }

    // ================= IMAGEKIT UPLOAD =================

    const prepared = await prepareEventImages(
      req,
      organizer.businessId,
      payload,
      (data) => saveEventSchema.parse(data)
    );

    uploadedFileIds = prepared.uploadedFileIds;

    // ================= FINAL VALIDATION =================

    const input = saveEventSchema.parse(
      prepared.payload
    );

    // ================= SAVE EVENT =================

    databaseStarted = true;

    const result = await saveEventService(
      organizer.businessId,
      input
    );

    databaseSaved = true;

    // ================= RESPONSE =================

    return res
      .status(result.isCreated ? 201 : 200)
      .json({
        success: true,

        message: result.isCreated
          ? "Event created successfully"
          : "Event updated successfully",

        data: {
          isCreated: result.isCreated,
          eventId: result.event.id,
          event: result.event,
        },
      });

  } catch (error) {
    // Cleanup new images when validation fails or
    // the database transaction is known to have failed.

    const knownTransactionFailure =
      error instanceof EventServiceError ||
      (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        [
          "P2002",
          "P2003",
          "P2025",
          "P2034",
        ].includes(error.code)
      );

    if (
      !databaseSaved &&
      uploadedFileIds.length > 0
    ) {
      if (
        !databaseStarted ||
        knownTransactionFailure
      ) {
        await cleanupEventImages(
          uploadedFileIds
        );
      } else {
        // Do not delete files if the transaction
        // outcome is uncertain.
        console.error(
          "Event images require reconciliation:",
          uploadedFileIds
        );
      }
    }

    return handleEventError(error, res);
  }
};

// ======================================================
// GET ALL EVENTS
// ======================================================

export const getAllEventsController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const query = getEventsQuerySchema.parse(
      req.query
    );

    const result = await getAllEventsService(
      organizer.businessId,
      query
    );

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: result.items,
      pagination: result.pagination,
    });

  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// GET EVENT BY ID
// ======================================================

export const getEventByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const event = await getEventByIdService(
      organizer.businessId,
      eventId
    );

    return res.status(200).json({
      success: true,
      message: "Event details fetched successfully",
      data: event,
    });

  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// DELETE EVENT - SOFT DELETE
// ======================================================

export const deleteEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const result = await deleteEventService(
      organizer.businessId,
      eventId
    );

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: result,
    });

  } catch (error) {
    return handleEventError(error, res);
  }
};
