import { Router } from "express";


import {
  getMyPlansController,
  submitDatePlanAttendanceController,
  
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


export default router;