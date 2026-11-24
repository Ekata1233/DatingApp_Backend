
import { Router } from "express";

import {
  verifyEventPartnerGstController,
} from "./gst-verification.controller";
import { partnerAuthMiddleware } from "../../../../../middleware/partnerAuth.middleware";

// Replace this path with your existing middleware import.


const router = Router();

router.post(
  "/gst/fetch-details",
  partnerAuthMiddleware,
  verifyEventPartnerGstController
);

export default router;
