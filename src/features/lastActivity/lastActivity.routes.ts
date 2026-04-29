import express from "express";
import { heartbeatController } from "./lastActivity.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/last-activity/heartbeat",authMiddleware, heartbeatController);

export default router;
