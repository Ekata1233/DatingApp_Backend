import {
  Router,
} from "express";

import {
  getManualGovernmentIdDetailsController,
  getManualGovernmentIdListController,
  reviewManualGovernmentIdController,
} from "./manual-government-id.controller";

const router =
  Router();

// GET ALL
router.get(
  "/verification/manual-government-id/",
  getManualGovernmentIdListController
);

// GET DETAILS
router.get(
  "/verification/manual-government-id/:id",
  getManualGovernmentIdDetailsController
);

// APPROVE / REJECT
router.patch(
  "/verification/manual-government-id/:id/review",
  reviewManualGovernmentIdController
);

export default router;