import { Router } from "express";

import {
  partnerAuthMiddleware,
} from "../../../../middleware/partnerAuth.middleware";

import {
  completePartnerGovernmentIdController,
  getOrganizerAboutYouController,
  getYourEventsController,
  initPartnerGovernmentIdController,
  partnerGovernmentIdCallbackController,
  saveOrganizerAboutYouController,
  saveYourEventsController,
  verifyEventPartnerPanController,
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

router.get("/organizer/your-events", partnerAuthMiddleware, getYourEventsController);
router.patch("/organizer/your-events", partnerAuthMiddleware, saveYourEventsController);


// ======================================================
// PAN VERIFY
// ======================================================
router.post(
  "/pan/submit",
  partnerAuthMiddleware,
  verifyEventPartnerPanController,
);

/* -------------------------------------------------------------------------- */
/*                           GOVERNMENT ID INIT                               */
/* -------------------------------------------------------------------------- */

router.post(
  "/government-id/init",
  partnerAuthMiddleware,
  initPartnerGovernmentIdController,
);

/* -------------------------------------------------------------------------- */
/*                         GOVERNMENT ID COMPLETE                             */
/* -------------------------------------------------------------------------- */

router.post(
  "/government-id/complete",
  partnerAuthMiddleware,
  completePartnerGovernmentIdController,
);
router.get("/government-id/callback", partnerGovernmentIdCallbackController);

export default router;
