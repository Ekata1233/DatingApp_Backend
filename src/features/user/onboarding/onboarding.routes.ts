// user.routes.ts

import { Router } from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { getUserDetailsController } from "./onboarding.controller";

const router = Router();

router.get(
  "/onboarding-details",
  authMiddleware,
  getUserDetailsController,
);

export default router;