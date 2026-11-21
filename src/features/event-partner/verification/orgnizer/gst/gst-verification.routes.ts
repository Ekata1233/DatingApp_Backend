
import { Router } from "express";

import {
  verifyEventPartnerGstController,
} from "./gst-verification.controller";
import { partnerAuthMiddleware } from "../../../../../middleware/partnerAuth.middleware";


const router = Router();

router.post(
  "/verify/gst",
  partnerAuthMiddleware,
  verifyEventPartnerGstController,
);

export default router;
