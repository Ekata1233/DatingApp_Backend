import {
  Router,
} from "express";

import {
  getMyIncomeVerificationController,
  submitIncomeVerificationController,
} from "./income.controller";
import authMiddleware from "../../../middleware/auth.middleware";



const router =
  Router();

// ======================================================
// SUBMIT INCOME VERIFICATION
// ======================================================

router.post(
  "/verification/income/submit",
  authMiddleware,
  submitIncomeVerificationController
);

// ======================================================
// GET MY INCOME VERIFICATION STATUS
// ======================================================

router.get(
  "/verification/income/status",
  authMiddleware,
  getMyIncomeVerificationController
);

export default router;