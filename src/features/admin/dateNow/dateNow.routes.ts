// Date Now Routes
import express from "express";

import {
  upsertDatePlanOptions,
  getOptions,
  getDatePlanPackagesController,
  updateDatePlanPackageController,
  createDatePlanPackageController
} from "./dateNow.controller";

const router = express.Router();

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

export default router;