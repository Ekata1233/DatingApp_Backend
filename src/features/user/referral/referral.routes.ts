import { Router } from "express";
import { applyReferralController, referralDashboardController, validateReferralController } from "./referral.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/referral-validate",
  authMiddleware,
  validateReferralController
);

router.post(
"/apply-referral",
authMiddleware,
applyReferralController
);

router.get(
  "/referral/dashboard",
  authMiddleware,
  referralDashboardController
);

export default router;