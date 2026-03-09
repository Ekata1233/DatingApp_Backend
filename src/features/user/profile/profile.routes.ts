import express from "express";
import { enterNameController } from "./profile.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/profile/name:
 *   patch:
 *     summary: Update user's name
 *     tags: [User Profile]
 *     description: Updates the logged-in user's name as part of onboarding. Automatically moves the user to the next onboarding step.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Khushi"
 *     responses:
 *       200:
 *         description: Name saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Name saved successfully
 *               onboarding_step: 2
 *       400:
 *         description: Validation or other error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Name must be at least 2 characters"
 *       401:
 *         description: Unauthorized, invalid or missing JWT
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Authorization token missing or invalid"
 */

router.patch("/profile/name", authMiddleware, enterNameController);

export default router;
