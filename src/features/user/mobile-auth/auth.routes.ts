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
 *                 example: "+919876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: OTP sent successfully
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
 *                 example: "+919876543210"
 *               otp:
 *                 type: string
 *                 example: "393312"
 *     responses:
 *       200:
 *         description: Phone verified successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Phone verified successfully
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMmEyMWJlZC0yNWUwLTQyYTktOGRjYi0zNWUxMWJlMDY2N2YiLCJpYXQiOjE2NzkxMzQ4MDAsImV4cCI6MTY3OTk5ODgwMH0.XYZ"
 *               user:
 *                 id: "12a21bed-25e0-42a9-8dcb-35e11be0667f"
 *                 name: null
 *                 email: null
 *                 phone_number: "+918862060875"
 *                 google_id: null
 *                 is_phone_verified: true
 *                 onboarding_step: 1
 *                 onboarding_completed: false
 *                 created_at: "2026-03-09T06:06:04.555Z"
 *                 updated_at: "2026-03-09T06:06:04.555Z"
 */
router.post("/verify-otp", verifyOtpController);

export default router;
