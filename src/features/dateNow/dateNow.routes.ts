import { Router } from "express";

import {
  createDraftController,
  updateDraftController,
  publishPlanController,
  requestToJoinController,
  skipDatePlanController,
  discoverDatePlanController,
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

router.get(
  "/date-plans/discover",
  authMiddleware,
  discoverDatePlanController
);

router.post(
  "/date-plans/:id/skip",
  authMiddleware,
  skipDatePlanController
);

router.post(
  "/date-plans/:id/request",
  authMiddleware,
  requestToJoinController
);

export default router;