import { Router } from "express";

import {
  getAllAdminReactivationsController,
  getAdminReactivationByIdController,
  reviewReactivationController,
} from "./adminEventReactivation.controller";

const router = Router();

router.get(
  "/get-all",
  getAllAdminReactivationsController
);

router.get(
  "/:reactivationId/get",
  getAdminReactivationByIdController
);

router.patch(
  "/:reactivationId/review",
  reviewReactivationController
);

export default router;