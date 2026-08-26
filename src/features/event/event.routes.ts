import { Router } from "express";
import authMiddleware from "../../middleware/auth.middleware";
import { getEventBookingPaymentSuccessController } from "./event.controller";


const router = Router();

router.get(
  "/event-bookings/:bookingId/payment-success",
  authMiddleware,
  getEventBookingPaymentSuccessController,
);

export default router;