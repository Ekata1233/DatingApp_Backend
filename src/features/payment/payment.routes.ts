// import express, { Router } from "express";
// import {
//   createPaymentOrder,
//   verifyPaymentController,
//   razorpayWebhook,
// } from "./payment.controller";
// import authMiddleware from "../../middleware/auth.middleware";

// const router = Router();

// router.post("/create-order", authMiddleware, createPaymentOrder);

// router.post("/verify", authMiddleware, verifyPaymentController);

// // No authMiddleware — Razorpay calls this, not your user.
// // express.raw() so signature verification gets the raw body.
// router.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   razorpayWebhook
// );

// export default router;

import { Router } from "express";
import * as controller from "./payment.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.post("/create-order",authMiddleware, controller.createPayment);

export default router;