// modules/swipe/swipe.routes.ts

import express from "express";
import { swipeUser } from "./swipe.controller";
import authMiddleware from "../../middleware/auth.middleware";

const router = express.Router();

router.post("/swipe", authMiddleware, swipeUser);

export default router;
