import { Router } from "express";

import {
  createDraftController,
  updateDraftController,
  publishPlanController,
  requestToJoinController,
  skipDatePlanController,
  discoverDatePlanController,
  declineDatePlanRequestController,
  approveDatePlanRequestController,
  getDatePlanRequestsController,
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

router.get(
  "/date-plans/:planId/requests",
  authMiddleware,
  getDatePlanRequestsController
);

router.patch(
  "/date-plan-requests/:requestId/approve",
  authMiddleware,
  approveDatePlanRequestController
);

router.patch(
  "/date-plan-requests/:requestId/decline",
  authMiddleware,
  declineDatePlanRequestController
);

export default router;