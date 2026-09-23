
import { Router } from "express";

import authMiddleware from "../../../middleware/auth.middleware";

import {
  getEmploymentVerificationsAdminController,
  getEmploymentVerificationDetailsAdminController,
  reviewEmploymentVerificationController,
} from "./employment.controller";



const router = Router();

router.get(
  "/get-all",
  getEmploymentVerificationsAdminController
);

router.get(
  "/:id",
  getEmploymentVerificationDetailsAdminController
);

router.patch(
  "/:id/review",
  reviewEmploymentVerificationController
);

export default router;