import { Router } from "express";
import { applyReferralController, referralDashboardController, referralHistoryController, validateReferralController } from "./referral.controller";
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


router.get(
  "/referral/history",
  authMiddleware,
  referralHistoryController
);

export default router;