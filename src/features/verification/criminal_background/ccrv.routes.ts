import { Router } from "express";

import authMiddleware from
  "../../../middleware/auth.middleware";

import {
  generateCCRVController,
  fetchCCRVController,
} from "./ccrv.controller";

const router = Router();

// Generate criminal background report

router.post(
  "/generate",
  authMiddleware,
  generateCCRVController
);

// Fetch criminal background report

router.get(
  "/fetch",
  authMiddleware,
  fetchCCRVController
);

export default router;