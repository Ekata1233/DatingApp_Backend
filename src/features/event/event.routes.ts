import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { cancelEventBookingController, getEventBookingPaymentSuccessController, getUserEventBookingsController } from "./event.controller";


const router = Router();

router.get(
  "/event-bookings/:bookingId/payment-success",
  authMiddleware,
  getEventBookingPaymentSuccessController,
);

router.get(
  "/event/my-ticket",
  authMiddleware,
  getUserEventBookingsController
);

router.post(
  "/event-bookings/:bookingId/cancel",
  authMiddleware,
  cancelEventBookingController,
);
export default router;