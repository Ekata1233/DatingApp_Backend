import express from "express";
import { heartbeatController } from "./lastActivity.controller";

const router = express.Router();

router.post("/heartbeat", heartbeatController);

export default router;
