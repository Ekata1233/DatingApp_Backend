// modules/swipe/swipe.routes.ts

import express from "express";
import { swipeController } from "./swipe.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/", authMiddleware, swipeController);

export default router;
