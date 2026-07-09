import { Router } from "express";
import { validateReferralController } from "./referral.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/validate",
  authMiddleware,
  validateReferralController
);

export default router;