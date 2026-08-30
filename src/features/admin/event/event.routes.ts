import { Router } from "express";
import { createEventController, getAllEventsController, getEventDetailsController, getEventListController, publishEventController, updateEventExperienceController, updateEventHostController, updateEventSafetyController, updateEventTicketsController, updateEventVenueController } from "./event.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();

router.post(
  "/events/basic",
  createEventController
);
router.patch(
  "/events/:id/host",
  updateEventHostController
);

router.patch(
  "/events/:id/venue",
  updateEventVenueController
);

router.patch(
  "/events/:id/tickets",
  updateEventTicketsController
);
router.patch(
  "/events/:id/experience",
  updateEventExperienceController
);
router.patch(
  "/events/:id/safety",
  updateEventSafetyController
);
router.post(
  "/events/:id/review-publish",
  publishEventController
);
router.get(
  "/events/get-all",
  getAllEventsController
);
router.get(
  "/events/get",
   authMiddleware,
  getEventListController
);
router.get(
  "/events/details/:id",
  getEventDetailsController
);
export default router;