import {
  Router,
} from "express";

import {
  submitManualGovernmentIdController,
  getMyManualGovernmentIdController,
} from "./manual-government-id.controller";
import authMiddleware from "../../../middleware/auth.middleware";



const router =
  Router();

// POST
// /api/user/verification/manual-government-id/submit
router.post(
  "/verification/manual-government-id/submit",
  authMiddleware,
  submitManualGovernmentIdController
);

// GET
// /api/user/verification/manual-government-id/status
router.get(
  "/verification/manual-government-id/status",
  authMiddleware,
  getMyManualGovernmentIdController
);

export default router;