import { Request, Response } from "express";

import {
  handleEventError,
} from "../../event-partner/events/event.controller";

import {
  adminReactivationIdSchema,
  adminReactivationQuerySchema,
  reviewReactivationSchema,
} from "./adminEventReactivation.validation";

import {
  getAllAdminReactivationsService,
  getAdminReactivationByIdService,
  reviewReactivationService,
} from "./adminEventReactivation.service";

// ======================================================
// GET ALL REQUESTS
// ======================================================

export const getAllAdminReactivationsController =
  async (req: Request, res: Response) => {
    try {
      const query =
        adminReactivationQuerySchema.parse(
          req.query
        );

      const result =
        await getAllAdminReactivationsService(
          query
        );

      return res.status(200).json({
        success: true,
        message:
          "Event reactivation requests fetched successfully",

        data: result.items,

        pagination: result.pagination,
      });
    } catch (error) {
      return handleEventError(error, res);
    }
  };

// ======================================================
// GET REQUEST DETAILS
// ======================================================

export const getAdminReactivationByIdController =
  async (req: Request, res: Response) => {
    try {
      const reactivationId =
        adminReactivationIdSchema.parse(
          req.params.reactivationId
        );

      const result =
        await getAdminReactivationByIdService(
          reactivationId
        );

      return res.status(200).json({
        success: true,
        message:
          "Reactivation details fetched successfully",

        data: result,
      });
    } catch (error) {
      return handleEventError(error, res);
    }
  };

// ======================================================
// REVIEW / APPROVE / REJECT
// ======================================================

export const reviewReactivationController =
  async (req: Request, res: Response) => {
    try {
      const reactivationId =
        adminReactivationIdSchema.parse(
          req.params.reactivationId
        );

      const input =
        reviewReactivationSchema.parse(req.body);

      const result =
        await reviewReactivationService(
          reactivationId,
          input
        );

      const messages = {
        UNDER_REVIEW:
          "Reactivation request is under review",

        APPROVED:
          "Event reactivation approved successfully",

        REJECTED:
          "Event reactivation rejected successfully",
      };

      return res.status(200).json({
        success: true,

        message: messages[input.status],

        data: result,
      });
    } catch (error) {
      return handleEventError(error, res);
    }
  };