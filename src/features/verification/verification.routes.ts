import { Router } from "express";

import {
  getTrustVerificationStatusController,
} from "./verification.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

router.get(
  "/verification/trust-status",
  authMiddleware,
  getTrustVerificationStatusController
);

export default router;