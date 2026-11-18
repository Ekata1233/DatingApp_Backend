import { Router } from "express";

import {
  sendOtp,
  verifyOtp,
  selectRole,
  logout,
} from "./partnerAuth.controller";

import {
  partnerAuthMiddleware,
} from "../../../middleware/partnerAuth.middleware";

const router = Router();

// ======================================================
// PUBLIC ROUTES
// ======================================================

router.post(
  "/auth/send-otp",
  sendOtp,
);

router.post(
  "/auth/verify-otp",
  verifyOtp,
);

// ======================================================
// PROTECTED ROUTES
// ======================================================

router.post(
  "/auth/select-role",
  partnerAuthMiddleware,
  selectRole,
);

router.post(
  "/auth/logout",
  partnerAuthMiddleware,
  logout,
);

export default router;