import express from "express";
import { enterBirthDateController, enterGenderController, enterInterestedInController, enterNameController, enterSexualOrientationController } from "./profile.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/user/profile/name:
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

/**
 * @swagger
 * /api/user/profile/birth-date:
 *   patch:
 *     summary: Update user's birth date
 *     tags: [User Profile]
 *     description: Saves the logged-in user's birth date as part of onboarding. Automatically moves the user to the next onboarding step.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - birth_date
 *             properties:
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "1995-06-15"
 *     responses:
 *       200:
 *         description: Birth date saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Birth date saved successfully"
 *               onboarding_step: 3
 *               birth_date: "1995-06-15T00:00:00.000Z"
 *       400:
 *         description: Validation or other error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "User must be at least 18 years old"
 *       401:
 *         description: Unauthorized, invalid or missing JWT
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Authorization token missing or invalid"
 */

router.patch("/profile/birth-date", authMiddleware, enterBirthDateController);

/**
 * @swagger
 * /api/user/profile/gender:
 *   patch:
 *     summary: Update user's gender
 *     tags: [User Profile]
 *     description: Saves the logged-in user's gender during onboarding.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gender
 *             properties:
 *               gender:
 *                 type: string
 *                 example: "Man"
 *                 description: Select gender from available options
 *                 enum:
 *                   - Man
 *                   - Women
 *                   - Non-Binary
 *                   - Prefer not to say
 *     responses:
 *       200:
 *         description: Gender saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Gender saved successfully"
 *               gender: "Man"
 *               onboarding_step: 4
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
 
router.patch("/profile/gender", authMiddleware, enterGenderController);

/**
 * @swagger
 * /api/user/profile/sexual-orientation:
 *   patch:
 *     summary: Update user's sexual orientation
 *     tags: [User Profile]
 *     description: Saves the logged-in user's sexual orientation during onboarding.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sexual_orientation
 *             properties:
 *               sexual_orientation:
 *                 type: string
 *                 example: "Straight"
 *                 enum:
 *                   - Straight
 *                   - Gay
 *                   - Lesbian
 *                   - Bisexual
 *                   - Asexual
 *                   - Demisexual
 *                   - Pansexual
 *                   - Queer
 *                   - Aromantic
 *                   - Not Listed
 *     responses:
 *       200:
 *         description: Sexual orientation saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Sexual orientation saved successfully"
 *               sexual_orientation: "Straight"
 *               onboarding_step: 5
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */

router.patch("/profile/sexual-orientation", authMiddleware, enterSexualOrientationController);

/**
 * @swagger
 * /api/user/profile/interested-in:
 *   patch:
 *     summary: Update user's dating preference
 *     tags: [User Profile]
 *     description: Saves who the logged-in user is interested in dating.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - interested_in
 *             properties:
 *               interested_in:
 *                 type: string
 *                 example: "Women"
 *                 enum:
 *                   - Women
 *                   - Man
 *                   - Everyone
 *     responses:
 *       200:
 *         description: Interested in preference saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Interested in preference saved successfully"
 *               interested_in: "Women"
 *               onboarding_step: 6
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */

router.patch("/profile/interested-in", authMiddleware, enterInterestedInController);


export default router;
