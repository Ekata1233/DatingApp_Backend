import express from "express";
import authMiddleware from "../../../middleware/auth.middleware";
import { getPrivacySettingsController, updatePrivacySettingsController } from "./privacy-controls.controller";



const router =
  express.Router();

router.get(
  "/privacy-controls/get",
  authMiddleware,
  getPrivacySettingsController,
);

router.patch(
  "/privacy-controls/update",
  authMiddleware,
  updatePrivacySettingsController,
);

export default router;