// Working on this file: src/features/notification/notification.repository.ts

import express from "express";
import * as controller from "./notification.controller";

const router = express.Router();

router.get("/", controller.getUserNotifications);
router.patch("/:id/read", controller.markRead);

export default router;