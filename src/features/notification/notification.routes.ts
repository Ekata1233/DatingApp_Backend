// Working on this file: src/features/notification/notification.repository.ts

import express from "express";
import * as controller from "./notification.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/", controller.getUserNotifications);
router.patch("/:id/read", controller.markRead);

router.post(
    "/notifications/device-token",
    authMiddleware,
    controller.saveDeviceToken,
);

export default router;