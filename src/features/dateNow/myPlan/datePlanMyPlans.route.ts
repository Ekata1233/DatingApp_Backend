import { Router } from "express";


import {
  getMyPlansController,
  submitDatePlanAttendanceController,
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


export default router;