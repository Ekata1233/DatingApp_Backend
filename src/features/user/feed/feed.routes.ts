// modules/user/user.routes.ts

import express from "express";
import { getFeedController } from "./feed.controller";
import  authMiddleware  from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/feed", authMiddleware, getFeedController);

export default router;
