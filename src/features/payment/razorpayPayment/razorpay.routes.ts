import { Router } from "express";


import {
  createRazorpayOrderController,
  verifyRazorpayController,
  getRazorpayStatusController,
} from "./razorpay.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

// CREATE RAZORPAY ORDER
router.post(
  "/create-order",
  authMiddleware,
  createRazorpayOrderController,
);

// VERIFY RAZORPAY PAYMENT
router.post(
  "/verify",
  authMiddleware,
  verifyRazorpayController,
);

// GET PAYMENT STATUS
router.get(
  "/:paymentId/status",
  authMiddleware,
  getRazorpayStatusController,
);

export default router;