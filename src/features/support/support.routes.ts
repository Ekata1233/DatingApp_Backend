import { Router } from "express";

import {
  cancelCallbackController,
  createCallbackController,
  createFaqController,
  deleteFaqController,
  getAdminCallbackByIdController,
  getAdminCallbacksController,
  getAdminFaqsController,
  getCallbackHistoryController,
  getFaqsController,
  updateCallbackStatusController,
  updateFaqController,
} from "./support.controller";

import authMiddleware from "../../middleware/auth.middleware";

const router = Router();

/* =========================================================
   USER
========================================================= */

// Request a callback
router.post(
  "/support/callback",
  authMiddleware,
  createCallbackController,
);

// Get logged-in user's callback history
router.get(
  "/support/callback/history",
  authMiddleware,
  getCallbackHistoryController,
);

// Cancel callback
router.patch(
  "/user/callback/:id/cancel",
  authMiddleware,
  cancelCallbackController,
);

// Get active FAQs
router.get(
  "/support/faqs/get",
  getFaqsController,
);

/* =========================================================
   ADMIN CALLBACK
   No adminAuthMiddleware
========================================================= */

// Get all callback requests
router.get(
  "/admin/callbacks",
  getAdminCallbacksController,
);

// Get specific callback
router.get(
  "/admin/callbacks/:id",
  getAdminCallbackByIdController,
);

// Update callback status
router.patch(
  "/admin/callbacks/:id/status",
  updateCallbackStatusController,
);

/* =========================================================
   ADMIN FAQ
   No adminAuthMiddleware
========================================================= */

// Create FAQ
router.post(
  "/support/faqs",
  createFaqController,
);

// Get all FAQs including inactive
router.get(
  "/admin/faqs",
  getAdminFaqsController,
);

// Update FAQ
router.patch(
  "/admin/faqs/:id",
  updateFaqController,
);

// Delete FAQ
router.delete(
  "/admin/faqs/:id",
  deleteFaqController,
);

export default router;