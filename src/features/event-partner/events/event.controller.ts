import { Request, Response } from "express";

import { Prisma } from "@prisma/client";

import { ZodError } from "zod";

import {
  saveEventSchema,
  getEventsQuerySchema,
  eventIdSchema,
  pauseEventSchema,
  completeEventSchema,
} from "./event.validation";

import {
  saveEventService,
  getAllEventsService,
  getEventByIdService,
  deleteEventService,
  submitEventService,
  publishEventService,
  pauseEventService,
  completeEventService,
} from "./event.service";

import { OrganizerContext, EventServiceError } from "./event.types";

import {
  parseEventPayload,
  prepareEventImages,
  cleanupEventImages,
} from "./event.imagekit";

// ======================================================
// GET AUTHENTICATED ORGANIZER
// ======================================================

const getOrganizer = (req: Request): OrganizerContext => {
  const partner = (
    req as Request & {
      partner?: OrganizerContext;
    }
  ).partner;

  if (!partner?.id) {
    throw new EventServiceError("Unauthorized organizer", 401);
  }

  if (partner.role !== "ORGANIZER") {
    throw new EventServiceError("Only organizers can manage events", 403);
  }

  if (!partner.businessId) {
    throw new EventServiceError("Organizer business details not found", 403);
  }

  return partner;
};

// ======================================================
// COMMON ERROR HANDLER
// ======================================================

const handleEventError = (error: unknown, res: Response) => {
  // ZOD VALIDATION ERROR

  if (error instanceof ZodError) {
    console.error(
      "[EVENT] Zod validation failed:",
      error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    );

    return res.status(400).json({
      success: false,
      message: "Validation failed",

      errors: error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  // SERVICE ERROR

  if (error instanceof EventServiceError) {
    console.error("[EVENT] Service error:", {
      message: error.message,
      statusCode: error.statusCode,
    });

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // PRISMA ERROR

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[EVENT] Prisma error:", {
      code: error.code,
      message: error.message,
      meta: error.meta,
    });

    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate event data",
      });
    }

    if (error.code === "P2003") {
      return res.status(409).json({
        success: false,
        message: "Operation conflicts with related event records",
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
        message: "Concurrent event update detected. Please retry.",
      });
    }
  }

  // UNKNOWN ERROR

  console.error("[EVENT] Internal server error:", error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};

// ======================================================
// PATCH - CREATE OR UPDATE EVENT WITH IMAGEKIT
// ======================================================

export const saveEventController = async (req: Request, res: Response) => {
  const startTime = Date.now();

  let currentStep = "Controller initialization";

  let uploadedFileIds: string[] = [];
  let databaseSaved = false;
  let databaseStarted = false;

  console.log("\n==================================================");

  console.log("[EVENT SAVE] Request received");

  console.log("[EVENT SAVE] Request details:", {
    method: req.method,
    url: req.originalUrl,
    contentType: req.headers["content-type"],
    bodyFields: Object.keys(req.body ?? {}),
    fileFields: Object.keys(req.files ?? {}),
  });

  try {
    // ==================================================
    // STEP 1 - AUTHENTICATION
    // ==================================================

    currentStep = "Organizer authentication";

    console.log("[STEP 1] Organizer authentication started");

    const organizer = getOrganizer(req);

    console.log("[STEP 1] Organizer authentication successful:", {
      role: organizer.role,
      hasBusinessId: Boolean(organizer.businessId),
    });

    // ==================================================
    // STEP 2 - PARSE REQUEST
    // ==================================================

    currentStep = "Request payload parsing";

    console.log("[STEP 2] Parsing request payload...");

    const payload = parseEventPayload(req);

    // Determine create/update from HTTP method and URL
    if (req.method === "POST") {
      // CREATE EVENT
      if (Object.prototype.hasOwnProperty.call(payload, "eventId")) {
        throw new EventServiceError(
          "eventId is not allowed when creating an event",
          400,
        );
      }
    } else if (req.method === "PATCH") {
      // UPDATE EVENT

      const eventId = eventIdSchema.parse(req.params.eventId);

      // eventId must come from URL only
      if (Object.prototype.hasOwnProperty.call(payload, "eventId")) {
        throw new EventServiceError(
          "Pass eventId in the URL only, not in the request body",
          400,
        );
      }

      // Pass URL eventId to existing save logic
      payload.eventId = eventId;
    } else {
      throw new EventServiceError("Method not allowed", 405);
    }
    console.log("[STEP 2] Request payload parsed successfully");

    console.log("[STEP 2] Payload details:", {
      eventId: payload.eventId ?? null,
      eventDurationType: payload.eventDurationType,
      tripType: payload.tripType ?? null,
      priceType: payload.priceType ?? null,

      operation: payload.eventId !== undefined ? "UPDATE" : "CREATE",

      payloadFields: Object.keys(payload),

      photoCount: Array.isArray(payload.photos) ? payload.photos.length : 0,

      dateCount: Array.isArray(payload.dates) ? payload.dates.length : 0,

      experienceCount: Array.isArray(payload.experience)
        ? payload.experience.length
        : 0,

      hasVenue: Boolean(payload.venue),

      hasTripDetails: Boolean(payload.tripDetails),

      tripDayCount: Array.isArray(payload.tripDetails?.days)
        ? payload.tripDetails.days.length
        : 0,

      faqCount: Array.isArray(payload.faqs) ? payload.faqs.length : 0,
    });

    console.log("[STEP 2] Received image files:", Object.keys(req.files ?? {}));

    // ==================================================
    // STEP 3 - UPDATE OWNERSHIP CHECK
    // ==================================================

    currentStep = "Event ownership verification";

    if (payload.eventId !== undefined) {
      console.log("[STEP 3] Update request detected");

      const eventId = eventIdSchema.parse(payload.eventId);

      console.log("[STEP 3] Checking event ownership:", eventId);

      const existingEvent = await getEventByIdService(
        organizer.businessId,
        eventId,
      );

      console.log("[STEP 3] Existing event found:", {
        eventId: existingEvent.id,
        status: existingEvent.status,
        eventDurationType: existingEvent.eventDurationType,
      });

      if (
        existingEvent.status !== "DRAFT" &&
        existingEvent.status !== "REJECTED"
      ) {
        throw new EventServiceError(
          "Only draft or rejected events can be updated",
          409,
        );
      }

      console.log("[STEP 3] Event ownership verified");
    } else {
      console.log("[STEP 3] New event creation detected");

      console.log("[STEP 3] Ownership check skipped for new event");
    }

    // ==================================================
    // STEP 4 - IMAGEKIT PREPARATION AND UPLOAD
    // ==================================================

    currentStep = "ImageKit preparation";

    const imageUploadStartTime = Date.now();

    console.log("[STEP 4] ImageKit preparation started");

    console.log(
      "[STEP 4] Total received file fields:",
      Object.keys(req.files ?? {}).length,
    );

    const prepared = await prepareEventImages(
      req,
      organizer.businessId,
      payload,

      (data) => {
        currentStep = "Pre-upload Zod validation";

        console.log("[STEP 4.1] Pre-upload validation started");

        const validatedData = saveEventSchema.parse(data);

        console.log("[STEP 4.1] Pre-upload validation successful");

        currentStep = "ImageKit file upload";

        console.log("[STEP 4.2] ImageKit upload started");

        return validatedData;
      },
    );

    uploadedFileIds = prepared.uploadedFileIds;

    console.log("[STEP 4] ImageKit preparation completed");

    console.log("[STEP 4] ImageKit upload result:", {
      uploadedImageCount: uploadedFileIds.length,
      executionTime: `${Date.now() - imageUploadStartTime} ms`,
    });

    // ==================================================
    // STEP 5 - FINAL ZOD VALIDATION
    // ==================================================

    currentStep = "Final Zod validation";

    console.log("[STEP 5] Final Zod validation started");

    const input = saveEventSchema.parse(prepared.payload);

    console.log("[STEP 5] Final Zod validation successful");

    console.log("[STEP 5] Validated event details:", {
      eventId: input.eventId ?? null,

      eventDurationType: input.eventDurationType,

      tripType: input.tripType ?? null,

      priceType: input.priceType,

      totalCapacity: input.totalCapacity,

      menCapacity: input.menCapacity,

      womenCapacity: input.womenCapacity,

      otherCapacity: input.otherCapacity,

      coupleCapacity: input.coupleCapacity,

      photoCount: input.photos?.length ?? 0,

      dateCount: input.dates?.length ?? 0,

      experienceCount: input.experience?.length ?? 0,

      tripDayCount: input.tripDetails?.days?.length ?? 0,

      tripStayCount: input.tripDetails?.stays?.length ?? 0,

      tripPlaceCount: input.tripDetails?.places?.length ?? 0,

      faqCount: input.faqs?.length ?? 0,
    });

    // ==================================================
    // STEP 6 - SAVE EVENT IN DATABASE
    // ==================================================

    currentStep = "Database save operation";

    const databaseStartTime = Date.now();

    console.log("[STEP 6] Database save started");

    databaseStarted = true;

    const result = await saveEventService(organizer.businessId, input);

    databaseSaved = true;

    console.log("[STEP 6] Database save completed successfully");

    console.log("[STEP 6] Database result:", {
      eventId: result.event.id,

      isCreated: result.isCreated,

      eventDurationType: result.event.eventDurationType,

      tripType: result.event.tripType,

      status: result.event.status,

      executionTime: `${Date.now() - databaseStartTime} ms`,
    });

    // ==================================================
    // STEP 7 - SEND RESPONSE
    // ==================================================

    currentStep = "Sending API response";

    const statusCode = result.isCreated ? 201 : 200;

    console.log("[STEP 7] Sending success response");

    console.log("[EVENT SAVE] Final result:", {
      success: true,

      statusCode,

      operation: result.isCreated ? "CREATE" : "UPDATE",

      eventId: result.event.id,

      totalExecutionTime: `${Date.now() - startTime} ms`,
    });

    return res.status(statusCode).json({
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
    // ==================================================
    // ERROR LOGGING
    // ==================================================

    console.error("\n================ EVENT SAVE FAILED ================");

    console.error("[EVENT SAVE] Failed at step:", currentStep);

    console.error(
      "[EVENT SAVE] Error message:",
      error instanceof Error ? error.message : error,
    );

    console.error("[EVENT SAVE] Error details:", {
      databaseStarted,
      databaseSaved,
      uploadedImageCount: uploadedFileIds.length,

      executionTime: `${Date.now() - startTime} ms`,
    });

    if (error instanceof Error) {
      console.error("[EVENT SAVE] Error stack:", error.stack);
    }

    // ==================================================
    // IMAGEKIT CLEANUP
    // ==================================================

    const knownTransactionFailure =
      error instanceof EventServiceError ||
      (error instanceof Prisma.PrismaClientKnownRequestError &&
        ["P2002", "P2003", "P2025", "P2034"].includes(error.code));

    if (!databaseSaved && uploadedFileIds.length > 0) {
      if (!databaseStarted || knownTransactionFailure) {
        console.log("[EVENT SAVE] ImageKit cleanup started");

        console.log("[EVENT SAVE] Images to clean up:", uploadedFileIds.length);

        await cleanupEventImages(uploadedFileIds);

        console.log("[EVENT SAVE] ImageKit cleanup attempt completed");
      } else {
        console.error("[EVENT SAVE] Database outcome uncertain");

        console.error(
          "[EVENT SAVE] Images require reconciliation:",
          uploadedFileIds,
        );
      }
    } else {
      console.log("[EVENT SAVE] No image cleanup required");
    }

    return handleEventError(error, res);
  } finally {
    console.log(
      "[EVENT SAVE] Total execution time:",
      `${Date.now() - startTime} ms`,
    );

    console.log("==================================================\n");
  }
};

// ======================================================
// GET ALL EVENTS
// ======================================================

export const getAllEventsController = async (req: Request, res: Response) => {
  const startTime = Date.now();

  console.log("\n[GET ALL EVENTS] Request received");

  try {
    const organizer = getOrganizer(req);

    console.log("[GET ALL EVENTS] Organizer authenticated");

    const query = getEventsQuerySchema.parse(req.query);

    console.log("[GET ALL EVENTS] Query validated:", {
      page: query.page,
      limit: query.limit,
      eventDurationType: query.eventDurationType,
      tripType: query.tripType,
      status: query.status,
    });

    console.log("[GET ALL EVENTS] Fetching events from database");

    const result = await getAllEventsService(organizer.businessId, query);

    console.log("[GET ALL EVENTS] Events fetched successfully:", {
      eventCount: result.items.length,
      pagination: result.pagination,

      executionTime: `${Date.now() - startTime} ms`,
    });

    return res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("[GET ALL EVENTS] Failed:", error);

    return handleEventError(error, res);
  }
};

// ======================================================
// GET EVENT BY ID
// ======================================================

export const getEventByIdController = async (req: Request, res: Response) => {
  const startTime = Date.now();

  console.log("\n[GET EVENT BY ID] Request received");

  try {
    const organizer = getOrganizer(req);

    console.log("[GET EVENT BY ID] Organizer authenticated");

    const eventId = eventIdSchema.parse(req.params.eventId);

    console.log("[GET EVENT BY ID] Event ID:", eventId);

    console.log("[GET EVENT BY ID] Fetching event from database");

    const event = await getEventByIdService(organizer.businessId, eventId);

    console.log("[GET EVENT BY ID] Event fetched successfully:", {
      eventId: event.id,

      eventDurationType: event.eventDurationType,

      tripType: event.tripType,

      status: event.status,

      executionTime: `${Date.now() - startTime} ms`,
    });

    return res.status(200).json({
      success: true,
      message: "Event details fetched successfully",
      data: event,
    });
  } catch (error) {
    console.error("[GET EVENT BY ID] Failed:", error);

    return handleEventError(error, res);
  }
};

// ======================================================
// DELETE EVENT - SOFT DELETE
// ======================================================

export const deleteEventController = async (req: Request, res: Response) => {
  const startTime = Date.now();

  console.log("\n[DELETE EVENT] Request received");

  try {
    const organizer = getOrganizer(req);

    console.log("[DELETE EVENT] Organizer authenticated");

    const eventId = eventIdSchema.parse(req.params.eventId);

    console.log("[DELETE EVENT] Event ID:", eventId);

    console.log("[DELETE EVENT] Soft delete started");

    const result = await deleteEventService(organizer.businessId, eventId);

    console.log("[DELETE EVENT] Event deleted successfully:", {
      eventId,

      executionTime: `${Date.now() - startTime} ms`,
    });

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("[DELETE EVENT] Failed:", error);

    return handleEventError(error, res);
  }
};


// ======================================================
// PREVIEW AND SUBMIT EVENT
// ======================================================

export const submitEventController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      "[EVENT SUBMIT] Request received"
    );

    // STEP 1 - Authenticate organizer
    const organizer = getOrganizer(req);

    // STEP 2 - Validate event ID
    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    console.log(
      "[EVENT SUBMIT] Event ID:",
      eventId
    );

    // STEP 3 - Submit event
    const event = await submitEventService(
      organizer.businessId,
      eventId
    );

    console.log(
      "[EVENT SUBMIT] Event submitted successfully:",
      {
        eventId: event.id,
        status: event.status,
        submittedAt: event.submittedAt,
      }
    );

    // STEP 4 - Return response
    return res.status(200).json({
      success: true,

      message:
        "Event preview and submission successful. Your event has been submitted for review.",

      data: {
        eventId: event.id,
        status: event.status,
        submittedAt: event.submittedAt,
        event,
      },
    });

  } catch (error) {
    console.error(
      "[EVENT SUBMIT] Submission failed:",
      error
    );

    return handleEventError(error, res);
  }
};

// ======================================================
// ORGANIZER PUBLISH EVENT
// ======================================================

export const publishEventController = async (
  req: Request,
  res: Response
) => {
  try {
    console.log(
      "[EVENT PUBLISH] Request received"
    );

    // STEP 1 - Authenticate organizer
    const organizer = getOrganizer(req);

    // STEP 2 - Validate event ID
    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    console.log(
      "[EVENT PUBLISH] Event ID:",
      eventId
    );

    console.log(
      "[EVENT PUBLISH] Business ID:",
      organizer.businessId
    );

    // STEP 3 - Publish event
    const event = await publishEventService(
      organizer.businessId,
      eventId
    );

    console.log(
      "[EVENT PUBLISH] Event published successfully",
      {
        eventId: event.id,
        status: event.status,
        publishedAt: event.publishedAt,
      }
    );

    // STEP 4 - Return success response
    return res.status(200).json({
      success: true,

      message: "Event published successfully",

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
      "[EVENT PUBLISH] Publishing failed:",
      error
    );

    return handleEventError(error, res);
  }
};

// ======================================================
// PAUSE EVENT CONTROLLER
// ======================================================

export const pauseEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const { pauseReason } = pauseEventSchema.parse(
      req.body
    );

    const event = await pauseEventService(
      organizer.businessId,
      eventId,
      pauseReason
    );

    return res.status(200).json({
      success: true,
      message: "Event paused successfully",
      data: {
        eventId: event.id,
        title: event.title,
        status: event.status,
        pausedAt: event.pausedAt,
        pauseReason: event.pauseReason,
        updatedAt: event.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "[PAUSE EVENT] Failed:",
      error
    );

    return handleEventError(error, res);
  }
};

// ======================================================
// COMPLETE EVENT CONTROLLER
// ======================================================

export const completeEventController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const { eventDateId } =
      completeEventSchema.parse(req.body);

    const event = await completeEventService(
      organizer.businessId,
      eventId,
      eventDateId
    );

    return res.status(200).json({
      success: true,

      message:
        event.status === "COMPLETED"
          ? "Event completed successfully"
          : "Event occurrence completed successfully",

      data: {
        eventId: event.id,
        title: event.title,
        status: event.status,
        eventDateId: event.eventDateId,
        eventDateStatus: event.eventDateStatus,
        eventDateCompletedAt:
          event.eventDateCompletedAt,
        completedAt: event.completedAt,
        remainingScheduledDates:
          event.remainingScheduledDates,
        updatedAt: event.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "[COMPLETE EVENT] Failed:",
      error
    );

    return handleEventError(error, res);
  }
};