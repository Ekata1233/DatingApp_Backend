import { Router } from "express";

import {
  getEducationVerificationsController,
  getEducationVerificationDetailsController,
  reviewEducationVerificationController,
} from "./education.controller";

const router = Router();

router.get(
  "/verification/education",
  getEducationVerificationsController
);

router.get(
  "/verification/education/:id",
  getEducationVerificationDetailsController
);

router.patch(
  "/verification/education/:id/review",
  reviewEducationVerificationController
);

export default router;