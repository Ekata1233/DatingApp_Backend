// Date Now Routes
import express from "express";

import {
  upsertDatePlanOptions,
  getOptions,
  getDatePlanPackagesController,
  updateDatePlanPackageController,
  createDatePlanPackageController,
  getDatePlansController,
  getDatePlanDetailsController
} from "./dateNow.controller";

const router = express.Router();

// No multer needed - uses existing file handling middleware
router.post("/create-options", upsertDatePlanOptions);
router.get("/options", getOptions);
router.post(
  "/date-plan-packages",
  createDatePlanPackageController
);

router.patch(
  "/date-plan-packages/:id",
  updateDatePlanPackageController
);

router.get(
  "/date-plan-packages",
  getDatePlanPackagesController
);

router.get(
  "/date-plans",
 
  getDatePlansController
);
router.get(
  "/date-plans/:planId",
 
  getDatePlanDetailsController
);
export default router;