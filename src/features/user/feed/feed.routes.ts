// modules/user/user.routes.ts

import express from "express";
import { getFeedController, getFeedDetailsController } from "./feed.controller";
import  authMiddleware  from "../../../middleware/auth.middleware";

const router = express.Router();

router.get("/feed", authMiddleware, getFeedController);

router.get("/feed/details/:userId", authMiddleware, getFeedDetailsController);


export default router;
