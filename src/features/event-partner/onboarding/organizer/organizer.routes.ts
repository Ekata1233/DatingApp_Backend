import { Router } from "express";

import {
  partnerAuthMiddleware,
} from "../../../../middleware/partnerAuth.middleware";

import {
  getOrganizerAboutYouController,
  saveOrganizerAboutYouController,
} from "./organizer.controller";

const router = Router();

// ======================================================
// 1. GET ORGANIZER ABOUT YOU
// ======================================================

router.get(
  "/organizer/about-you",

  partnerAuthMiddleware,

  getOrganizerAboutYouController,
);

// ======================================================
// 2. SAVE OR CONTINUE ABOUT YOU
// ======================================================

router.patch(
  "/organizer/about-you",

  partnerAuthMiddleware,

  saveOrganizerAboutYouController,
);

export default router;