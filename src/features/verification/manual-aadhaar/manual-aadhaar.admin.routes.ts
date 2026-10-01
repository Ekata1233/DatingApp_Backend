import { Router } from "express";

import {
  getManualAadhaarListController,
  getManualAadhaarDetailsController,
  reviewManualAadhaarController,
} from "./manual-aadhaar.controller";

const router = Router();

// ======================================================
// ADMIN - GET ALL MANUAL AADHAAR REQUESTS
// GET /api/admin/verification/manual-aadhaar
//
// Optional:
// ?status=IN_PROGRESS
// ?status=VERIFIED
// ?status=REJECTED
// ======================================================

router.get(
  "/verification/manual-aadhaar",
  getManualAadhaarListController
);

// ======================================================
// ADMIN - GET ONE MANUAL AADHAAR REQUEST
// GET /api/admin/verification/manual-aadhaar/:id
// ======================================================

router.get(
  "/verification/manual-aadhaar/:id",
  getManualAadhaarDetailsController
);

// ======================================================
// ADMIN - APPROVE / REJECT
// PATCH /api/admin/verification/manual-aadhaar/:id/review
// ======================================================

router.patch(
  "/verification/manual-aadhaar/:id/review",
  reviewManualAadhaarController
);

export default router;