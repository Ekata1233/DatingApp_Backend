import { Router } from "express";

import {
  submitEducationVerificationController,
  getMyEducationVerificationController,
} from "./education.controller";
import authMiddleware from "../../../middleware/auth.middleware";


const router = Router();

router.post(
  "/verification/education/submit",
  authMiddleware,
  submitEducationVerificationController
);

router.get(
  "/verification/education/status",
  authMiddleware,
  getMyEducationVerificationController
);

export default router;