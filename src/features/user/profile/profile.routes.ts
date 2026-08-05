import express from "express";
import { profileController, InterestedInController,ReligionController, updateLookingForController, addressController,
  //  aboutYourselfController, 
   saveUserAnswerController, updateLocationController, educatioController,  updatePhotoController, setPrimaryPhotoController, deletePhotoController, updateUserBioController, workController, FamilyProfileController, LanguageController, 
   UserPromptController,
   completeOnboardingController,
  
   updateVideoController,
   deleteVideoController,
   uploadPhotoController} from "./profile.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = express.Router();

/**
 * @swagger
 * /api/user/profile/basic-info:
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
 *                 example: "MEN"
 *               gender_option:
 *                 type: string
 *                 example: "STRAIGHT"
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

/**
 * @swagger
 * /api/user/profile/looking-for:
 *   patch:
 *     summary: Update user's relationship preference
 *     description: Updates the authenticated user's relationship preference (intention) during onboarding.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - intentionId
 *             properties:
 *               intentionId:
 *                 type: string
 *                 format: uuid
 *                 description: Intention ID
 *                 example: "fd2e6cae-2735-4459-8911-2204c632480c"
 *     responses:
 *       200:
 *         description: Relationship preference updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Relationship preference saved successfully
 *                 intention:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "fd2e6cae-2735-4459-8911-2204c632480c"
 *                     name:
 *                       type: string
 *                       example: Serious Relationship
 *                     priority:
 *                       type: integer
 *                       example: 1
 *                     active:
 *                       type: boolean
 *                       example: true
 *                 onboarding_step:
 *                   type: string
 *                   example: LOOKING_FOR
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             examples:
 *               MissingIntentionId:
 *                 summary: intentionId is missing
 *                 value:
 *                   success: false
 *                   message: optionId is required
 *               ValidationError:
 *                 summary: Validation Error
 *                 value:
 *                   success: false
 *                   message: Something went wrong
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: Invalid intention ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid intention
 */
router.patch("/profile/looking-for", authMiddleware, updateLookingForController);


/**
 * @swagger
 * /api/user/profile/religion:
 *   patch:
 *     summary: Update user's religion and community
 *     description: Updates the authenticated user's religion and community during onboarding. The selected community must belong to the selected religion.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - religionId
 *               - communityId
 *             properties:
 *               religionId:
 *                 type: integer
 *                 example: 1
 *                 description: Religion ID
 *               communityId:
 *                 type: integer
 *                 example: 1
 *                 description: Community ID
 *     responses:
 *       200:
 *         description: Religion updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Religion saved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "3f2d1e3a-2d8b-4f8d-9f54-2c7d0d9f8a11"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                     religionId:
 *                       type: integer
 *                       example: 1
 *                     communityId:
 *                       type: integer
 *                       example: 1
 *                     religion:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Hindu
 *                     community:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: Maratha
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation or update failed
 *         content:
 *           application/json:
 *             examples:
 *               CommunityNotFound:
 *                 summary: Community not found
 *                 value:
 *                   success: false
 *                   message: Community not found
 *               InvalidCommunity:
 *                 summary: Community does not belong to religion
 *                 value:
 *                   success: false
 *                   message: Selected community does not belong to selected religion
 *               UserIdMissing:
 *                 summary: User ID missing
 *                 value:
 *                   success: false
 *                   message: User ID is missing
 *       401:
 *         description: Unauthorized - Invalid or missing Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
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
 * /api/user/profile/address:
 *   patch:
 *     summary: Update user's address
 *     description: Updates the authenticated user's country, state, and city during onboarding. It also updates the onboarding step and recalculates the user's profile completion percentage.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - country
 *               - state
 *               - city
 *             properties:
 *               country:
 *                 type: string
 *                 example: India
 *                 description: Country name
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *                 description: State name
 *               city:
 *                 type: string
 *                 example: Kolhapur
 *                 description: City name
 *     responses:
 *       200:
 *         description: Address updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Address updated successfully
 *                 onboarding_step:
 *                   type: string
 *                   example: ADDRESS
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "3f2d1e3a-2d8b-4f8d-9f54-2c7d0d9f8a11"
 *                     user_id:
 *                       type: string
 *                       format: uuid
 *                       example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                     country:
 *                       type: string
 *                       example: India
 *                     state:
 *                       type: string
 *                       example: Maharashtra
 *                     city:
 *                       type: string
 *                       example: Kolhapur
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             examples:
 *               MissingUserId:
 *                 summary: User ID missing
 *                 value:
 *                   success: false
 *                   message: User ID is missing
 *               ValidationError:
 *                 summary: Validation Error
 *                 value:
 *                   success: false
 *                   message: Something went wrong
 *       401:
 *         description: Unauthorized - Invalid or missing Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/address", authMiddleware, addressController);

// router.patch("/profile/about-yourself", authMiddleware,aboutYourselfController);

/**
 * @swagger
 * /api/profile/location:
 *   patch:
 *     summary: Update user latitude and longitude
 *     tags: [User Profile]
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
 * /api/user/profile/education:
 *   patch:
 *     summary: Update user's education details
 *     description: Updates the authenticated user's education details during onboarding, including highest education, degree, college name, and graduation year.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - highestEdu
 *               - collegeName
 *               - degree
 *               - graduationYear
 *             properties:
 *               highestEdu:
 *                 type: string
 *                 description: Highest education level
 *                 enum:
 *                   - HIGH_SCHOOL
 *                   - DIPLOMA
 *                   - BACHELORS
 *                   - MASTERS
 *                   - DOCTORATE
 *                   - OTHER
 *                 example: HIGH_SCHOOL
 *               collegeName:
 *                 type: string
 *                 description: Name of the college or university
 *                 example: Shivaji University, Kolhapur
 *               degree:
 *                 type: string
 *                 description: Degree obtained
 *                 example: BCA
 *               graduationYear:
 *                 type: integer
 *                 description: Graduation year
 *                 example: 2024
 *     responses:
 *       200:
 *         description: Education updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Education updated successfully
 *                 onboarding_step:
 *                   type: string
 *                   example: EDUCATION
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f65e80c0-ef61-4b15-87a5-123456789abc"
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                     highestEdu:
 *                       type: string
 *                       example: HIGH_SCHOOL
 *                     collegeName:
 *                       type: string
 *                       example: Shivaji University, Kolhapur
 *                     degree:
 *                       type: string
 *                       example: BCA
 *                     graduationYear:
 *                       type: integer
 *                       example: 2024
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             examples:
 *               UserIdMissing:
 *                 summary: User ID missing
 *                 value:
 *                   success: false
 *                   message: User ID is missing
 *               ValidationError:
 *                 summary: Validation Error
 *                 value:
 *                   success: false
 *                   message: Something went wrong
 *       401:
 *         description: Unauthorized - Invalid or missing Bearer token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/education",authMiddleware,educatioController);

/**
 * @swagger
 * /api/user/profile/work:
 *   patch:
 *     summary: Update Work Details
 *     description: Updates the authenticated user's work information during onboarding.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               professionId:
 *                 type: integer
 *                 example: 1
 *               employmentTypeId:
 *                 type: integer
 *                 example: 1
 *               experienceId:
 *                 type: integer
 *                 example: 1
 *               ambitionId:
 *                 type: integer
 *                 example: 1
 *               salaryRangeId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Work details updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Work details updated successfully
 *                 onboarding_step:
 *                   type: string
 *                   example: WORK
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "d8e8b9d4-4d9c-4e1f-8d5b-123456789abc"
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                     professionId:
 *                       type: integer
 *                       example: 1
 *                     employmentTypeId:
 *                       type: integer
 *                       example: 1
 *                     experienceId:
 *                       type: integer
 *                       example: 1
 *                     ambitionId:
 *                       type: integer
 *                       example: 1
 *                     salaryRangeId:
 *                       type: integer
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-07T09:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-07T09:35:00.000Z"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User ID is missing
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/work",authMiddleware,workController);

/**
 * @swagger
 * /api/user/profile/family:
 *   patch:
 *     summary: Update Family Profile
 *     description: Updates the authenticated user's family profile details during onboarding.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               familyStatusId:
 *                 type: integer
 *                 example: 1
 *               familyTypeId:
 *                 type: integer
 *                 example: 2
 *               fatherOccupationId:
 *                 type: integer
 *                 example: 3
 *               fatherOrganisationId:
 *                 type: integer
 *                 example: 1
 *               motherOccupationId:
 *                 type: integer
 *                 example: 4
 *               motherOrganisationId:
 *                 type: integer
 *                 example: 2
 *               siblingRelationId:
 *                 type: integer
 *                 example: 1
 *               siblingOccupationId:
 *                 type: integer
 *                 example: 5
 *               siblingMaritalId:
 *                 type: integer
 *                 example: 2
 *               familyHomeId:
 *                 type: integer
 *                 example: 1
 *               nativePlaceId:
 *                 type: integer
 *                 example: 10
 *               familyIncomeId:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Family profile updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Family profile updated successfully.
 *                 onboarding_step:
 *                   type: string
 *                   example: FAMILY_DETAILS
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "5d0e3cb8-3af5-4eb9-82a6-123456789abc"
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                     familyStatusId:
 *                       type: integer
 *                       example: 1
 *                     familyTypeId:
 *                       type: integer
 *                       example: 2
 *                     fatherOccupationId:
 *                       type: integer
 *                       example: 3
 *                     fatherOrganisationId:
 *                       type: integer
 *                       example: 1
 *                     motherOccupationId:
 *                       type: integer
 *                       example: 4
 *                     motherOrganisationId:
 *                       type: integer
 *                       example: 2
 *                     siblingRelationId:
 *                       type: integer
 *                       example: 1
 *                     siblingOccupationId:
 *                       type: integer
 *                       example: 5
 *                     siblingMaritalId:
 *                       type: integer
 *                       example: 2
 *                     familyHomeId:
 *                       type: integer
 *                       example: 1
 *                     nativePlaceId:
 *                       type: integer
 *                       example: 10
 *                     familyIncomeId:
 *                       type: integer
 *                       example: 3
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-07T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-07-07T10:05:00.000Z"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Validation failed
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/family",authMiddleware,FamilyProfileController);

/**
 * @swagger
 * /api/user/profile/languages:
 *   patch:
 *     summary: Update User Languages
 *     description: Updates the authenticated user's known languages during onboarding.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - languageIds
 *             properties:
 *               languageIds:
 *                 type: array
 *                 description: Array of Language IDs selected by the user.
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Languages saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Languages saved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                       languageId:
 *                         type: integer
 *                         example: 1
 *                       language:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: English
 *                           priority:
 *                             type: integer
 *                             example: 1
 *                           active:
 *                             type: boolean
 *                             example: true
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     userMissing:
 *                       value: User ID is missing
 *                     noLanguages:
 *                       value: Please select at least one language
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/languages",authMiddleware,LanguageController);

/**
 * @swagger
 * /api/user/profile/photos:
 *   post:
 *     summary: Upload User Photos
 *     description: Upload one or more user profile photos during onboarding. The first uploaded image is automatically marked as the primary photo.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Select one or more image files.
 *     responses:
 *       200:
 *         description: Photos uploaded successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Photos uploaded successfully
 *                 onboarding_step:
 *                   type: string
 *                   example: LATEST_PHOTOS
 *                 next_step:
 *                   type: string
 *                   example: SELFIE_VERIFICATION
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "e0c1d2f3-1234-5678-9abc-def123456789"
 *                       user_id:
 *                         type: string
 *                         format: uuid
 *                         example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                       media_url:
 *                         type: string
 *                         example: "https://ik.imagekit.io/yourapp/user-photos/photo1.jpg"
 *                       media_type:
 *                         type: string
 *                         example: image
 *                       order:
 *                         type: integer
 *                         example: 1
 *                       is_primary:
 *                         type: boolean
 *                         example: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-07-07T10:30:00.000Z"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     noImages:
 *                       value: Images are required
 *                     noFiles:
 *                       value: No images provided
 *                     userMissing:
 *                       value: User ID is required
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.post("/profile/photos", authMiddleware, uploadPhotoController);

router.patch("/profile/photos/:photoId", authMiddleware, updatePhotoController);

router.patch("/profile/photos/:photoId/primary", authMiddleware, setPrimaryPhotoController);

router.delete("/profile/photos/:photoId", authMiddleware, deletePhotoController);




router.post("/profile/video", authMiddleware, updateVideoController);



router.delete("/profile/video/:videoId", authMiddleware, deleteVideoController);
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
router.patch("/profile/bio",authMiddleware,updateUserBioController);

/**
 * @swagger
 * /api/user/profile/prompts:
 *   patch:
 *     summary: Update User Prompts
 *     description: Updates the authenticated user's profile prompts. A maximum of 3 prompts can be selected.
 *     tags:
 *       - User Profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompts
 *             properties:
 *               prompts:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 3
 *                 items:
 *                   type: object
 *                   required:
 *                     - promptId
 *                     - answer
 *                   properties:
 *                     promptId:
 *                       type: string
 *                       format: uuid
 *                       example: "00000002-0000-4000-8000-000000000002"
 *                     answer:
 *                       type: string
 *                       example: "Long drives and coffee."
 *     responses:
 *       200:
 *         description: Prompts saved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Prompts saved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: "3f9f6b87-7f31-4d65-93a1-123456789abc"
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: "2886a20d-a75d-4458-acf7-e123456789ab"
 *                       promptId:
 *                         type: string
 *                         format: uuid
 *                         example: "00000002-0000-4000-8000-000000000002"
 *                       answer:
 *                         type: string
 *                         example: "Long drives and coffee."
 *                       displayOrder:
 *                         type: integer
 *                         example: 1
 *                       prompt:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                             example: "00000002-0000-4000-8000-000000000002"
 *                           question:
 *                             type: string
 *                             example: "My perfect weekend is..."
 *                           active:
 *                             type: boolean
 *                             example: true
 *                           priority:
 *                             type: integer
 *                             example: 1
 *                           category:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                                 example: "11111111-1111-1111-1111-111111111111"
 *                               name:
 *                                 type: string
 *                                 example: "Lifestyle"
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   examples:
 *                     userMissing:
 *                       value: User ID is missing
 *                     noPrompts:
 *                       value: Please select at least one prompt
 *                     maxPrompts:
 *                       value: You can select maximum 3 prompts
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 */
router.patch("/profile/prompts",authMiddleware,UserPromptController);


router.patch(
  "/profile/complete-onboarding",
  authMiddleware,
  completeOnboardingController
);
export default router;
