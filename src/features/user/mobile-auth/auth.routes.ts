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
import { logoutController, sendOtpController, verifyOtpController } from "./auth.controller";
import { prisma } from "../../../prisma/prismaClient";
import jwt from "jsonwebtoken";
import authMiddleware from "../../../middleware/auth.middleware";

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

router.post(
  "/logout",
  authMiddleware,
  logoutController,
);

router.post("/token/:userId", async (req, res) => {
  // =====================================================
  // ONLY ALLOW IN DEVELOPMENT
  // =====================================================

  if (process.env.NODE_ENV !== "development") {
    return res.status(403).json({
      success: false,
      message: "Not allowed",
    });
  }

  try {
    const { userId } = req.params;

    // =====================================================
    // FIND USER
    // =====================================================

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

    // =====================================================
    // BLOCK DELETED ACCOUNT
    // =====================================================

    if (
      user.account_status === "DELETED" ||
      user.deleted_at !== null
    ) {
      return res.status(403).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message:
          "This account has been deleted. Token cannot be generated.",
      });
    }

    // =====================================================
    // CHECK JWT SECRET
    // =====================================================

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    // =====================================================
    // CREATE SESSION EXPIRY
    // =====================================================

    const sessionExpiry = new Date();

    sessionExpiry.setDate(
      sessionExpiry.getDate() + 30,
    );

    // =====================================================
    // CREATE USER SESSION
    // =====================================================

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        isActive: true,
        expiresAt: sessionExpiry,
      },
    });

    // =====================================================
    // CREATE JWT
    // IMPORTANT: userId + sessionId
    // =====================================================

    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: session.id,
      },
      jwtSecret,
      {
        expiresIn: "30d",
      },
    );

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,
      message: "Token generated successfully",
      data: {
        token,
        sessionId: session.id,
        account_status: user.account_status,
      },
    });

  } catch (error) {
    console.error(
      "Generate Token Error:",
      error,
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
});

export default router;
