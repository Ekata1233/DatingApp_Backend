import { Router } from "express";

import {
  getAllAdminReactivationsController,
  getAdminReactivationByIdController,
  reviewReactivationController,
} from "./adminEventReactivation.controller";

const router = Router();

router.get(
  "/event-reactivations/get-all",
  getAllAdminReactivationsController
);

router.get(
  "/event-reactivations/:reactivationId/get",
  getAdminReactivationByIdController
);

router.patch(
  "/event-reactivations/:reactivationId/review",
  reviewReactivationController
);

export default router;