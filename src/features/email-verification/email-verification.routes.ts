import { Router } from "express";



import {
  sendEmailOtpController,
  verifyEmailOtpController,
} from "./email-verification.controller";
import { partnerAuthMiddleware } from "../../middleware/partnerAuth.middleware";

const router = Router();

/* -------------------------------------------------------------------------- */
/*                              SEND EMAIL OTP                                */
/* -------------------------------------------------------------------------- */

router.post(
  "/email/send-otp",
  partnerAuthMiddleware,
  sendEmailOtpController,
);

/* -------------------------------------------------------------------------- */
/*                              VERIFY EMAIL OTP                              */
/* -------------------------------------------------------------------------- */

router.post(
  "/email/verify-otp",
  partnerAuthMiddleware,
  verifyEmailOtpController,
);

export default router;