import { Request, Response } from "express";

import {
  guestListParamsSchema,
  guestListQuerySchema,
} from "./guest.validation";

import {
  getGuestListService,
  GuestListError,
} from "./guest.service";


// ========================================
// GET GUEST LIST CONTROLLER
// ========================================

export const getGuestListController = async (
  req: Request,
  res: Response,
) => {
  try {
    const partner = (req as any).partner;

    // Authentication
    if (!partner?.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Validate business access
    if (!partner.businessId) {
      return res.status(403).json({
        success: false,
        message: "Business access not found",
      });
    }

    // Validate partner role
    if (
      partner.role !== "ORGANIZER" &&
      partner.role !== "HOST"
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Validate route params
    const paramsResult =
      guestListParamsSchema.safeParse(
        req.params,
      );

    if (!paramsResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid route parameters",
        errors: paramsResult.error.flatten(),
      });
    }

    // Validate query params
    const queryResult =
      guestListQuerySchema.safeParse(
        req.query,
      );

    if (!queryResult.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: queryResult.error.flatten(),
      });
    }

    const { eventId } = paramsResult.data;

    const {
      eventDateId,
      type,
      search,
      page,
      limit,
    } = queryResult.data;

    // Fetch guest list
    const data = await getGuestListService({
      partnerId: partner.id,
      businessId: partner.businessId,
      role: partner.role,

      eventId,
      eventDateId,

      type,
      search,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Guest list fetched successfully",
      data,
    });

  } catch (error: unknown) {
    console.error(
      "Get Guest List Error:",
      error,
    );

    if (error instanceof GuestListError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch guest list",
    });
  }
};