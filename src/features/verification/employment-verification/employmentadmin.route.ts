
import { Router } from "express";

import authMiddleware from "../../../middleware/auth.middleware";

import {
  getEmploymentVerificationsAdminController,
  getEmploymentVerificationDetailsAdminController,
  reviewEmploymentVerificationController,
} from "./employment.controller";



const router = Router();

router.get(
  "/employment-verification/get-all",
  getEmploymentVerificationsAdminController
);

router.get(
  "/employment-verification/:id",
  getEmploymentVerificationDetailsAdminController
);

router.patch(
  "/employment-verification/:id/review",
  reviewEmploymentVerificationController
);

export default router;