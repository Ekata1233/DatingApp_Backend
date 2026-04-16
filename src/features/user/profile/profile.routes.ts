import express from "express";
import { profileController, InterestedInController,ReligionController, enterLookingForController, addressController, aboutYourselfController, saveUserAnswerController, updateLocationController, educatioController, uploadPhotosController, updatePhotoController, setPrimaryPhotoController, deletePhotoController, updateUserBioController, workController } from "./profile.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/user/profile/:
 *   patch:
 *     summary: Update user profile
 *     tags: [User Profile]
 *     description: Updates the logged-in user's basic profile details (name, email, birth date, height, gender) and moves onboarding to the next step.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - birth_date
 *               - height
 *               - gender
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Rahul Sharma"
 *               email:
 *                 type: string
 *                 example: "rahul@example.com"
 *               birth_date:
 *                 type: string
 *                 format: date
 *                 example: "2000-05-15"
 *               height:
 *                 type: number
 *                 example: 170
 *               gender:
 *                 type: string
 *                 example: "male"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Profile updated successfully"
 *               onboarding_step: 2
 *               data:
 *                 id: "uuid"
 *                 full_name: "Rahul Sharma"
 *                 email: "rahul@example.com"
 *                 birth_date: "2000-05-15T00:00:00.000Z"
 *                 height: 170
 *                 gender: "female"
 *       400:
 *         description: Validation or other error
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Height must be a number"
 *       401:
 *         description: Unauthorized, invalid or missing JWT
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Authorization token missing or invalid"
 */

router.patch("/profile/basic-info", authMiddleware, profileController);

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

router.patch("/profile/interested-in", authMiddleware, InterestedInController);

router.patch("/profile/religion", authMiddleware, ReligionController);

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

// router.patch("/profile/sexual-orientation", authMiddleware, enterSexualOrientationController);



/**
 * @swagger
 * /api/user/profile/looking-for:
 *   patch:
 *     summary: Update user's relationship preference
 *     tags: [User Profile]
 *     description: Saves the type of relationship the logged-in user is looking for.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - looking_for
 *             properties:
 *               looking_for:
 *                 type: string
 *                 example: "Marriage"
 *                 enum:
 *                   - Marriage
 *                   - Long term
 *                   - Casual
 *     responses:
 *       200:
 *         description: Relationship preference saved successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Relationship preference saved successfully"
 *               looking_for: "Marriage"
 *               onboarding_step: 7
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */

router.patch("/profile/looking-for", authMiddleware, enterLookingForController);

router.patch("/profile/address", authMiddleware, addressController);

router.patch("/profile/about-yourself", authMiddleware,aboutYourselfController);

/**
 * @swagger
 * /api/user/lnglat:
 *   patch:
 *     summary: Update user latitude and longitude
 *     tags: [User Location]
 *     description: Updates the logged-in user's latitude and longitude coordinates. This API does NOT affect onboarding steps.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 18.5204
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 73.8567
 *     responses:
 *       200:
 *         description: Location coordinates updated successfully
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: "Location updated successfully"
 *               data:
 *                 latitude: 18.5204
 *                 longitude: 73.8567
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Latitude must be between -90 and 90"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               message: "Unauthorized"
 */

router.patch("/profile/location", authMiddleware, updateLocationController);
router.patch("/profile/answer", authMiddleware, saveUserAnswerController);


/**
 * @swagger
 * /api/user/profile/education-work:
 *   patch:
 *     summary: Update education and work details
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               highestEdu:
 *                 type: string
 *                 example: "B.Tech"
 *               collegeName:
 *                 type: string
 *                 example: "IIT Bombay"
 *               incomeRange:
 *                 type: string
 *                 example: "INR 1 lakh to 2 lakh"
 *               workingWith:
 *                 type: string
 *                 example: "PRIVATE_COMPANY"
 *               workingAs:
 *                 type: string
 *                 example: "Software Engineer"
 *               companyName:
 *                 type: string
 *                 example: "Google"
 *     responses:
 *       200:
 *         description: Education & work updated successfully
 */
router.patch(
  "/profile/education",
  authMiddleware,
    educatioController
);

router.patch(
  "/profile/work",
  authMiddleware,
  workController
);

router.post("/profile/photos", authMiddleware, uploadPhotosController);

router.patch("/profile/photos/:photoId", authMiddleware, updatePhotoController);

router.patch("/profile/photos/:photoId/primary", authMiddleware, setPrimaryPhotoController);

router.delete("/profile/photos/:photoId", authMiddleware, deletePhotoController);



/**
 * @swagger
 * /api/user/profile/bio:
 *   patch:
 *     summary: Update user bio
 *     tags: [User Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *                 maxLength: 300
 *                 example: "I love traveling and exploring new places."
 *     responses:
 *       200:
 *         description: Bio updated successfully
 */
router.patch(
  "/profile/bio",
  authMiddleware,
  updateUserBioController
);
export default router;
