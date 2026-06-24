import { Router } from "express";

import {
  createDraftController,
  updateDraftController,
  publishPlanController,
} from "./dateNow.controller";

import  authMiddleware  from "../../middleware/auth.middleware";

const router = Router();

router.post(
  "/date-plans",
  authMiddleware,
  createDraftController
);

router.patch(
  "/date-plans/:id",
  authMiddleware,
  updateDraftController
);

router.post(
  "/date-plans/:id/publish",
  authMiddleware,
  publishPlanController
);

export default router;