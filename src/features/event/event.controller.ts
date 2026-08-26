import { Request, Response } from "express";
import { getEventBookingPaymentSuccess } from "./event.service";

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