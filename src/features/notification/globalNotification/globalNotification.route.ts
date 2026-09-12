import {
  Router,
} from "express";


import * as controller from "./globalNotification.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();


/**
 * Get notification settings
 */
router.get(
  "/notification/settings",
  authMiddleware,
  controller.getGlobalNotificationSettingController,
);


/**
 * Update notification settings
 */
router.patch(
  "/notification/settings",
  authMiddleware,
  controller.updateGlobalNotificationSettingController,
);

export default router;