
import { Router } from "express";

import {
  saveEventController,
  getAllEventsController,
  getEventByIdController,
  deleteEventController,
} from "./event.controller";

// Use your existing authentication middleware.
// Adjust these import paths if required.



import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";

const router = Router();

// Authentication and organizer authorization
router.use(
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER")
);

// CREATE + UPDATE
router.patch(
  "/events/create",
  saveEventController
);

// GET ALL
router.get(
  "/events/get-all",
  getAllEventsController
);

// GET BY ID
router.get(
  "/events/:eventId/get",
  getEventByIdController
);

// SOFT DELETE
router.delete(
  "/events/:eventId/delete",
  deleteEventController
);

export default router;
