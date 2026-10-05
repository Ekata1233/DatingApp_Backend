import express from "express";
import { getProfileSummaryController, getUserDetailsController } from "./details.controller";
import authMiddleware from "../../../middleware/auth.middleware";

const router =  express.Router();

router.get("/details/:id",authMiddleware, getUserDetailsController);

router.get(
  "/profile-summary",
  authMiddleware,
  getProfileSummaryController,
);

export default router;