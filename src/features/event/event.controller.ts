import { Request, Response } from "express";
import { getEventBookingPaymentSuccess, getUserEventBookingsService } from "./event.service";

export const getEventBookingPaymentSuccessController = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = (req as any).user.id;
    const bookingId = req.params.bookingId as string;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const data = await getEventBookingPaymentSuccess(
      userId,
      bookingId,
    );

    return res.status(200).json({
      success: true,
      message: "Event booking payment details fetched successfully",
      data,
    });
  } catch (error: any) {
    console.error(
      "GET EVENT BOOKING PAYMENT SUCCESS ERROR:",
      error,
    );

    return res.status(400).json({
      success: false,
      message: error.message || "Failed to fetch payment details",
    });
  }
};

export const getUserEventBookingsController = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const status =
      typeof req.query.status === "string"
        ? req.query.status
        : "ALL";

    const page =
      typeof req.query.page === "string"
        ? parseInt(req.query.page, 10)
        : 1;

    const limit =
      typeof req.query.limit === "string"
        ? parseInt(req.query.limit, 10)
        : 20;

    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive number",
      });
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    const result = await getUserEventBookingsService({
      userId,
      status,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      message: "Your event bookings fetched successfully",
      data: result,
    });
  } catch (error: any) {
    console.error("Get user event bookings error:", error);

    return res.status(400).json({
      success: false,
      message:
        error.message || "Failed to fetch event bookings",
    });
  }
};