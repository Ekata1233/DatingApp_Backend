import { Router } from "express";

import {
  getAllAdminEventsController,
  reviewAdminEventController,
} from "./adminEvent.controller";

const router = Router();

// GET ALL EVENTS - ALL STATUSES
router.get(
  "/events/get-all-list",
  getAllAdminEventsController
);

router.patch(
  "/events/:eventId/review",
  reviewAdminEventController
);

export default router;