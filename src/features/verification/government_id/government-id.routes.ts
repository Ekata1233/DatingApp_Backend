import { Router } from "express";

import authMiddleware from
  "../../../middleware/auth.middleware";

import {
  initGovernmentIdController,
  governmentIdCallbackController,
  completeGovernmentIdController,
  getGovernmentIdStatusController,
} from "./government-id.controller";

const router = Router();

// Start DigiLocker verification
router.post(
  "/government-id/init",
  authMiddleware,
  initGovernmentIdController
);

// Gridlines redirects here after authorization
router.get(
  "/government-id/callback",
  governmentIdCallbackController
);

// Fetch and verify selected Government ID
router.post(
  "/government-id/complete",
  authMiddleware,
  completeGovernmentIdController
);

// Get current verification status
router.get(
  "/government-id/status",
  authMiddleware,
  getGovernmentIdStatusController
);

export default router;