import { Router } from "express";
import { createOrUpdateDatePlanBoostController, getDatePlanBoostController } from "./datePlanBoost.controller";



const router = Router();

router.post(
  "/date-plan-boosts/create-or-update",
  createOrUpdateDatePlanBoostController,
);

router.get(
  "/date-plan-boosts/get",
  getDatePlanBoostController,
);

export default router;