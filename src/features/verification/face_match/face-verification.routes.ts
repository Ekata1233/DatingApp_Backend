
import { Router } from "express";

import authMiddleware from
  "../../../middleware/auth.middleware";


import {
  verifyFaceController,
  getFaceVerificationStatusController,
} from "./face-verification.controller";
import { faceUpload } from "./face-upload.middleware";

const router = Router();

// POST - Verify selfie with Government ID photo
router.post(
  "/verification/face/verify",
  authMiddleware,
  verifyFaceController
);

// GET - Current face verification status
router.get(
  "/verification/face/status",
  authMiddleware,
  getFaceVerificationStatusController
);

export default router;