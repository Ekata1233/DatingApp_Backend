import {
  Router,
} from "express";

import {
  getIncomeVerificationDetailsController,
  getIncomeVerificationsController,
  reviewIncomeVerificationController,
} from "./income.controller";

const router =
  Router();

// ======================================================
// GET ALL
// ======================================================

router.get(
  "/verification/income/",
  getIncomeVerificationsController
);

// ======================================================
// GET DETAILS
// ======================================================

router.get(
  "/verification/income/:id",
  getIncomeVerificationDetailsController
);

// ======================================================
// APPROVE / REJECT
// ======================================================

router.patch(
  "/verification/income/:id/review",
  reviewIncomeVerificationController
);

export default router;