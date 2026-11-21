
import { Router } from "express";

import { verifyEventPartnerPanController } from "./pan-verification.controller";
import { partnerAuthMiddleware } from "../../../../../middleware/partnerAuth.middleware";


const router = Router();

router.post(
  "/pan/fetch-details",
  partnerAuthMiddleware,
  verifyEventPartnerPanController,
);

export default router;
