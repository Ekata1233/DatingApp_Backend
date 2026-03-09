import { Router } from "express";
import { googleLoginController } from "./google-auth.controller";

const router = Router();

/**
 * @swagger
 * /api/user/google-login:
 *   post:
 *     summary: Login with Google
 *     tags: [User Authentication]
 *     description: Logs in the user using a Google ID token. Returns JWT token and user details for authenticated sessions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token obtained from Google Sign-In
 *                 example: "REAL_GOOGLE_ID_TOKEN"
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "f38e1cfc-8c36-46c7-bdf6-407445d57e19"
 *                     name:
 *                       type: string
 *                       example: "Pranjal Ghadage"
 *                     email:
 *                       type: string
 *                       example: "ghadagepranjal2001@gmail.com"
 *                     phone_number:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     google_id:
 *                       type: string
 *                       example: "117123201132252888412"
 *                     is_phone_verified:
 *                       type: boolean
 *                       example: false
 *                     onboarding_step:
 *                       type: integer
 *                       example: 1
 *                     onboarding_completed:
 *                       type: boolean
 *                       example: false
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-03-09T06:22:07.342Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-03-09T06:22:07.342Z"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *       400:
 *         description: Google authentication failed
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
 *                   example: "Google Authentication Failed"
 */



router.post("/google-login", googleLoginController);

export default router;
