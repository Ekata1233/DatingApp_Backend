import {
  Router,
} from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { activateDatePlanBoostController, getActiveDatePlanBoostController } from "./datePlanUserBoost.controller";



const router = Router();


// Activate selected boost
router.post(
  "/date-plan-boost/:datePlanId/activate",
  authMiddleware,
  activateDatePlanBoostController,
);


// Get currently active boost
router.get(
  "/date-plan-boost/:datePlanId/active",
  authMiddleware,
  getActiveDatePlanBoostController,
);
export default router;

