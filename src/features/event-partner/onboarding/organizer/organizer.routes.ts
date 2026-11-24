import { Router } from "express";

import { partnerAuthMiddleware } from "../../../../middleware/partnerAuth.middleware";

import {
  completePartnerGovernmentIdController,
  getOrganizerAboutYouController,
  getOrganizerOnboardingController,
  getYourEventsController,
  initPartnerGovernmentIdController,
  partnerGovernmentIdCallbackController,
  saveOrganizerAboutYouController,
  saveOrganizerBusinessDetailsController,
  saveOrganizerGstController,
  saveOrganizerIdentityDetailsController,
  saveYourEventsController,
  saveOrganizerBusinessPanController,
  verifyOrganizerIdentityPanController,
  verifyOrganizerFaceController,
} from "./organizer.controller";
import { verifyEventPartnerPanController } from "../../verification/orgnizer/pan/pan-verification.controller";

const router = Router();

router.get("/organizer/onboarding-details", partnerAuthMiddleware, getOrganizerOnboardingController);



// ======================================================
// STEP -1
// ======================================================
router.get(
  "/organizer/about-you",
  partnerAuthMiddleware,
  getOrganizerAboutYouController,
);

router.patch(
  "/organizer/about-you",
  partnerAuthMiddleware,
  saveOrganizerAboutYouController,
);


// ======================================================
// STEP -2
// ======================================================
router.post("/organizer/gst/save", partnerAuthMiddleware, saveOrganizerGstController);

router.post("/organizer/business-pan/save", partnerAuthMiddleware, saveOrganizerBusinessPanController);

router.patch("/organizer/business-details/save", partnerAuthMiddleware, saveOrganizerBusinessDetailsController);


// ======================================================
// STEP -3
// ======================================================
router.post(
  "/organizer/government-id/init",
  partnerAuthMiddleware,
  initPartnerGovernmentIdController,
);

router.post(
  "/organizer/government-id/complete",
  partnerAuthMiddleware,
  completePartnerGovernmentIdController,
);

router.get("/organizer/government-id/callback", partnerGovernmentIdCallbackController);

router.post("/organizer/identity-pan/verify", partnerAuthMiddleware, verifyOrganizerIdentityPanController);

router.post(
  "/organizer/face/verify",
  partnerAuthMiddleware,
  verifyOrganizerFaceController,
);

router.patch("/organizer/verified-details/save", partnerAuthMiddleware, saveOrganizerIdentityDetailsController);

// ======================================================
// STEP -4
// ======================================================
router.patch(
  "/organizer/your-events",
  partnerAuthMiddleware,
  saveYourEventsController,
);

// ======================================================
// STEP -5
// ======================================================

router.post("/organizer/business-pan/fetch-details", partnerAuthMiddleware, verifyEventPartnerPanController);



// router.post("/organizer/pan/save", partnerAuthMiddleware, saveOrganizerBusinessPanController);





router.get(
  "/organizer/your-events",
  partnerAuthMiddleware,
  getYourEventsController,
);





export default router;
