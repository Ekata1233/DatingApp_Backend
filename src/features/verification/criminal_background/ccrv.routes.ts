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
  "/criminal-background/generate",
  authMiddleware,
  generateCCRVController
);

// Fetch criminal background report

router.get(
  "/criminal-background/fetch",
  authMiddleware,
  fetchCCRVController
);

export default router;