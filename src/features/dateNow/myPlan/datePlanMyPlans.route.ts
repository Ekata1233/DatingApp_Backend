import { Router } from "express";


import {
  getMyPlansController,
  submitDatePlanAttendanceController,
  submitExperienceFeedbackController,
  submitNoShowFeedbackController,
  updateMetUserController,
  
} from "./datePlanMyPlans.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.get(
  "/date-plans/my-plans",
  authMiddleware,
  getMyPlansController,
);

router.post(
  "/:planId/feedback/is_meet",
  authMiddleware,
  submitDatePlanAttendanceController
);

router.put(
  "/:planId/feedback/met-user",
  authMiddleware,
  updateMetUserController
);

router.post(
  "/date-plans/:planId/feedback/experience",
  authMiddleware,
  submitExperienceFeedbackController
);

router.post(
  "/date-plans/:planId/feedback/no-show",
  authMiddleware,
  submitNoShowFeedbackController
);


export default router;