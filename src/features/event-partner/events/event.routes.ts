import { Router } from "express";

import {
  saveEventController,
  getAllEventsController,
  getEventByIdController,
  deleteEventController,
  submitEventController,
  publishEventController,
  completeEventController,
  pauseEventController,
} from "./event.controller";

import { partnerAuthMiddleware } from "../../../middleware/partnerAuth.middleware";
import { requirePartnerRole } from "../../../middleware/partnerRole.middleware";

const router = Router();

// Authentication and organizer authorization
router.use(
  partnerAuthMiddleware,
  requirePartnerRole("ORGANIZER")
);

// CREATE EVENT
router.post(
  "/events/create",
  saveEventController
);

// UPDATE EVENT BY ID
router.patch(
  "/events/:eventId/update",
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

router.patch(
  "/events/:eventId/submit",
  submitEventController
);

// PUBLISH APPROVED EVENT
router.patch(
  "/events/:eventId/publish",
  publishEventController
);
// Pause published event
router.patch(
  "/events/:eventId/pause",
  pauseEventController
);
// Complete event occurrence
router.patch(
  "/events/:eventId/complete",
  completeEventController
);
// SOFT DELETE
router.delete(
  "/events/:eventId/delete",
  deleteEventController
);

export default router;