import { Router } from "express";
import { applyReferralController, validateReferralController } from "./referral.controller";
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

export default router;