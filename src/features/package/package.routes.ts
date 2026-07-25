import express from "express";
import {
  activatePackageController,
  checkFeatureAccessController,
  recordFeatureUsageController,
  getActivePackageController,
} from "./package.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

// Activate package after successful payment
router.post(
  "/activate",
  authMiddleware,
  activatePackageController
);

// Check if user has access to a specific feature
router.get(
  "/check-access",
  authMiddleware,
  checkFeatureAccessController
);

// Record feature usage (called when user uses a feature)
router.post(
  "/record-usage",
  authMiddleware,
  recordFeatureUsageController
);

// Get user's active package details
router.get(
  "/active",
  authMiddleware,
  getActivePackageController
);

export default router;