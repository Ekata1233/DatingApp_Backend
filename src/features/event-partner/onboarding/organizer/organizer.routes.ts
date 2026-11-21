import { Router } from "express";

import {
  partnerAuthMiddleware,
} from "../../../../middleware/partnerAuth.middleware";

import {
  completePartnerGovernmentIdController,
  getOrganizerAboutYouController,
  initPartnerGovernmentIdController,
  saveOrganizerAboutYouController,
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


// ======================================================
// PAN VERIFY
// ======================================================
router.post(
  "/pan",
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
export default router;