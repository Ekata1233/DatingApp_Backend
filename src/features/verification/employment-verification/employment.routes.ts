import { Router } from "express";

import authMiddleware from "../../../middleware/auth.middleware";

import {
  verifyEmploymentByMobileController,
  verifyEmploymentByUANController,
  getEmploymentStatusController,
  submitEmploymentVerificationController,
  getMyEmploymentVerificationController,
} from "./employment.controller";

const router = Router();

// Option 1: mobile → Fetch UAN → Fetch Latest Employment
// Body: { "mobile_number": "9876543210", "consent": "Y" }
router.post(
  "/employment/verify/mobile",
  authMiddleware,
  verifyEmploymentByMobileController
);

// Option 2: UAN → Fetch Latest Employment
// Body: { "uan": "100012345678", "consent": "Y" }
router.post(
  "/employment/verify/uan",
  authMiddleware,
  verifyEmploymentByUANController
);

// Current verification status
router.get(
  "/employment/status",
  authMiddleware,
  getEmploymentStatusController
);
router.post(
  "/employment-verification/submit",
  authMiddleware,
  submitEmploymentVerificationController
);

router.get(
  "/employment-verification/my-verification",
  authMiddleware,
  getMyEmploymentVerificationController
);
export default router;