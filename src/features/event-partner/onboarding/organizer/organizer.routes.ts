import { Router } from "express";

import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";

import {
  completePartnerGovernmentIdController,
  getOrganizerAboutYouController,
  getYourEventsController,
  initPartnerGovernmentIdController,
  partnerGovernmentIdCallbackController,
  saveOrganizerAboutYouController,
  saveOrganizerGstController,
  saveYourEventsController,
  verifyEventPartnerPanController,
  verifyOrganizerFaceController,
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

// ======================================================
// PAN VERIFY & SAVE
// ======================================================
router.post("/organizer/pan/save", partnerAuthMiddleware, verifyEventPartnerPanController);

// ======================================================
// GST VERIFY & SAVE
// ======================================================
router.post("/organizer/gst/save", partnerAuthMiddleware, saveOrganizerGstController);

// ======================================================
// FACE VERIFY
// ======================================================
router.post(
  "/organizer/face/verify",
  partnerAuthMiddleware,
  verifyOrganizerFaceController,
);


// ======================================================
// EVENTS - NEXT STEP
// ======================================================
router.get(
  "/organizer/your-events",
  partnerAuthMiddleware,
  getYourEventsController,
);

router.patch(
  "/organizer/your-events",
  partnerAuthMiddleware,
  saveYourEventsController,
);



export default router;
