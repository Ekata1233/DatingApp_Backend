// Date Now Routes
import express from "express";

import {
  upsertDatePlanOptions,
  getOptions,
  getDatePlanPackagesController,
  updateDatePlanPackageController,
  createDatePlanPackageController,
  getDatePlansController,
  getDatePlanDetailsController,
  createDatePlanPackageInfoController,
  getDatePlanPackageInfoController,
  createDatePlanPackageFeaturesController,
  getDatePlanPackageFeaturesController,
  getAllDatePlanPackageDataController,
  getDatePlanPackageDataController
} from "./dateNow.controller";
import authMiddleware from "../../../middleware/auth.middleware";

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
// ==========================================
// COMMON DATE PLAN PACKAGE INFO
// ==========================================

router.post(
  "/date-plan-package-info",
  createDatePlanPackageInfoController,
);

router.get(
  "/date-plan-package-info",
  getDatePlanPackageInfoController,
);

// ==========================================
// COMMON DATE PLAN PACKAGE FEATURES
// ==========================================

router.post(
  "/date-plan-package-features",
  createDatePlanPackageFeaturesController,
);

router.get(
  "/date-plan-package-features",
  getDatePlanPackageFeaturesController,
);
router.get(
  "/date-plan-packages/all",
  getAllDatePlanPackageDataController,
);
router.get(
  "/date-plan-packages/get-all",
   authMiddleware,
  getDatePlanPackageDataController,
);
export default router;