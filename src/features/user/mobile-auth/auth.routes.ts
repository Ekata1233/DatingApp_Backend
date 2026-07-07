// import { Router } from "express";
// import {
//   sendOtpController,
//   verifyOtpController,
// } from "./auth.controller";

// const router = Router();

// router.post("/send-otp", sendOtpController);
// router.post("/verify-otp", verifyOtpController);

// export default router;

import { Router } from "express";
import { sendOtpController, verifyOtpController } from "./auth.controller";

const router = Router();

/**
 * @swagger
 * /api/user/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [User Mobile Authentication]
 *     description: Sends a one-time password (OTP) to the user's phone number for verification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send-otp", sendOtpController);

/**
 * @swagger
 * /api/user/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [User Mobile Authentication]
 *     description: Verifies the OTP sent to the user's phone number and authenticates the user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - otp
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "393312"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 */
router.post("/verify-otp", verifyOtpController);

export default router;
