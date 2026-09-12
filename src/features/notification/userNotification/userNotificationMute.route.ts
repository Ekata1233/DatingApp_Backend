import { Router } from "express";

import * as controller from "./userNotificationMute.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router = Router();


router.patch(
  "/notification/users/:userId/mute",
  authMiddleware,
  controller.muteUserNotificationController,
);


router.patch(
  "/notification/users/:userId/unmute",
  authMiddleware,
  controller.unmuteUserNotificationController,
);


router.get(
  "/notification/muted-users",
  authMiddleware,
  controller.getMutedUsersController,
);

router.get(
  "/notification/users/:userId/mute-status",
  authMiddleware,
  controller.getUserMuteStatusController,
);


export default router;