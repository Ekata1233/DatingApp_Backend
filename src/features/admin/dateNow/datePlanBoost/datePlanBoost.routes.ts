import { Router } from "express";
import { createOrUpdateDatePlanBoostController, getActiveDatePlanBoostForMobileController, getDatePlanBoostController } from "./datePlanBoost.controller";
import authMiddleware from "../../../../middleware/auth.middleware";



const router = Router();

router.post(
  "/date-plan-boosts/create-or-update",
  createOrUpdateDatePlanBoostController,
);

router.get(
  "/date-plan-boosts/get-all",
  getDatePlanBoostController,
);
router.get(
  "/date-plan-boosts/get",
  authMiddleware,
  getActiveDatePlanBoostForMobileController,
);
export default router;