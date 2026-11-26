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
} from "./event.reactivation.validation";

import {
  createReactivationService,
  updateReactivationService,
  submitReactivationService,
  publishReactivationService,
  getAllReactivationsService,
  getReactivationByIdService,
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