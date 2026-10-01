import { Router } from "express";

import {
  submitManualAadhaarController,
  getMyManualAadhaarController,
} from "./manual-aadhaar.controller";
import authMiddleware from "../../../middleware/auth.middleware";


const router = Router();

// ======================================================
// USER - SUBMIT MANUAL AADHAAR
// POST /api/user/verification/manual-aadhaar/submit
// ======================================================

router.post(
  "/verification/manual-aadhaar/submit",
  authMiddleware,
  submitManualAadhaarController
);

// ======================================================
// USER - GET OWN MANUAL AADHAAR STATUS
// GET /api/user/verification/manual-aadhaar/status
// ======================================================

router.get(
  "/verification/manual-aadhaar/status",
  authMiddleware,
  getMyManualAadhaarController
);

export default router;