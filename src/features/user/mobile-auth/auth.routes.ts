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
import { prisma } from "../../../prisma/prismaClient";
import jwt from "jsonwebtoken";

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

router.post("/token/:userId", async (req, res) => {

  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Not allowed",
    });
  }

  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    return res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;
