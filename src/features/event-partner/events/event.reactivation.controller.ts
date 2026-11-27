import { Request, Response } from "express";

import {
  getOrganizer,
  handleEventError,
} from "./event.controller";

import { eventIdSchema } from "./event.validation";

import {
  reactivationIdSchema,
  saveReactivationSchema,
  getReactivationQuerySchema,
  pauseReactivationSchema,
  completeReactivationSchema,
  cancelReactivationSchema,
} from "./event.reactivation.validation";

import {
  createReactivationService,
  updateReactivationService,
  submitReactivationService,
  publishReactivationService,
  getAllReactivationsService,
  getReactivationByIdService,
  pauseReactivationService,
  completeReactivationService,
  cancelReactivationService,
} from "./event.reactivation.service";

// ======================================================
// CREATE REACTIVATION
// ======================================================

export const createReactivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const input = saveReactivationSchema.parse(
      req.body
    );

    const result = await createReactivationService(
      organizer.businessId,
      eventId,
      input
    );

    return res.status(201).json({
      success: true,
      message: "Reactivation draft created successfully",
      data: result,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// UPDATE REACTIVATION
// ======================================================

export const updateReactivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const reactivationId =
      reactivationIdSchema.parse(
        req.params.reactivationId
      );

    const input = saveReactivationSchema.parse(
      req.body
    );

    const result = await updateReactivationService(
      organizer.businessId,
      eventId,
      reactivationId,
      input
    );

    return res.status(200).json({
      success: true,
      message: "Reactivation dates updated successfully",
      data: result,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// SUBMIT REACTIVATION
// ======================================================

export const submitReactivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const reactivationId =
      reactivationIdSchema.parse(
        req.params.reactivationId
      );

    const result = await submitReactivationService(
      organizer.businessId,
      eventId,
      reactivationId
    );

    return res.status(200).json({
      success: true,
      message:
        "Reactivation request submitted for admin approval",
      data: result,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// PUBLISH REACTIVATION
// ======================================================

export const publishReactivationController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const reactivationId =
      reactivationIdSchema.parse(
        req.params.reactivationId
      );

    const result = await publishReactivationService(
      organizer.businessId,
      eventId,
      reactivationId
    );

    return res.status(200).json({
      success: true,
      message: "Event reactivated and published successfully",
      data: result,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// GET ALL REACTIVATIONS
// ======================================================

export const getAllReactivationsController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const query =
      getReactivationQuerySchema.parse(req.query);

    const result = await getAllReactivationsService(
      organizer.businessId,
      eventId,
      query
    );

    return res.status(200).json({
      success: true,
      message: "Reactivation history fetched successfully",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};

// ======================================================
// GET REACTIVATION DETAILS
// ======================================================

export const getReactivationByIdController = async (
  req: Request,
  res: Response
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId
    );

    const reactivationId =
      reactivationIdSchema.parse(
        req.params.reactivationId
      );

    const result = await getReactivationByIdService(
      organizer.businessId,
      eventId,
      reactivationId
    );

    return res.status(200).json({
      success: true,
      message: "Reactivation details fetched successfully",
      data: result,
    });
  } catch (error) {
    return handleEventError(error, res);
  }
};


// ======================================================
// PAUSE REACTIVATED EVENT CONTROLLER
// ======================================================

export const pauseReactivationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId,
    );

    const reactivationId = reactivationIdSchema.parse(
      req.params.reactivationId,
    );

    const input = pauseReactivationSchema.parse(
      req.body,
    );

    const result = await pauseReactivationService(
      organizer.businessId,
      eventId,
      reactivationId,
      input,
    );

    return res.status(200).json({
      success: true,

      message: "Reactivated event paused successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[PAUSE REACTIVATION] Error:",
      error,
    );

    return handleEventError(error, res);
  }
};

// ======================================================
// COMPLETE REACTIVATED EVENT CONTROLLER
// ======================================================

export const completeReactivationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId,
    );

    const reactivationId = reactivationIdSchema.parse(
      req.params.reactivationId,
    );

    const input = completeReactivationSchema.parse(
      req.body,
    );

    const result = await completeReactivationService(
      organizer.businessId,
      eventId,
      reactivationId,
      input,
    );

    return res.status(200).json({
      success: true,

      message:
        "Reactivated event date completed successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[COMPLETE REACTIVATION] Error:",
      error,
    );

    return handleEventError(error, res);
  }
};

// ======================================================
// CANCEL REACTIVATED EVENT CONTROLLER
// ======================================================

export const cancelReactivationController = async (
  req: Request,
  res: Response,
) => {
  try {
    const organizer = getOrganizer(req);

    const eventId = eventIdSchema.parse(
      req.params.eventId,
    );

    const reactivationId = reactivationIdSchema.parse(
      req.params.reactivationId,
    );

    const input = cancelReactivationSchema.parse(
      req.body,
    );

    const result = await cancelReactivationService(
      organizer.businessId,
      eventId,
      reactivationId,
      input,
    );

    return res.status(200).json({
      success: true,

      message:
        "Reactivated event date cancelled successfully",

      data: result,
    });

  } catch (error) {
    console.error(
      "[CANCEL REACTIVATION] Error:",
      error,
    );

    return handleEventError(error, res);
  }
};