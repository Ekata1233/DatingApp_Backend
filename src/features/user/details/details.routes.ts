import express from "express";
import { getProfileSummaryController, getUserDetailsController } from "./details.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router =  express.Router();


//In flutter developer this api is not used - details api -> management folder
router.get("/details/:id",authMiddleware, getUserDetailsController);

//working
router.get(
  "/profile-summary",
  authMiddleware,
  getProfileSummaryController,
);

export default router;